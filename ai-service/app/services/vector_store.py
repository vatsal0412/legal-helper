from __future__ import annotations

import hashlib
import time
from uuid import uuid5, NAMESPACE_URL
from typing import Any, cast

from qdrant_client import QdrantClient
from qdrant_client.http import models as rest

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

client = QdrantClient(
    url=settings.qdrant_url,
    api_key=settings.qdrant_api_key or None,
    timeout=120,
)

VECTOR_NAME = "text"
VECTOR_SIZE = 3072  # Updated for current Gemini embedding API output


# -------------------------------
# Collection Setup
# -------------------------------
def ensure_collection(vector_size: int = VECTOR_SIZE) -> None:
    try:
        info = client.get_collection(settings.qdrant_collection)
        vectors = info.config.params.vectors

        # Validate named vector schema
        if not isinstance(vectors, dict):
            raise ValueError("Collection uses unnamed vector")

        if VECTOR_NAME not in vectors:
            raise ValueError("Missing 'text' vector")

        if vectors[VECTOR_NAME].size != vector_size:
            raise ValueError("Vector size mismatch")

    except Exception as e:
        print(f"[INFO] Recreating collection due to: {e}")

        client.recreate_collection(
            collection_name=settings.qdrant_collection,
            vectors_config={
                VECTOR_NAME: rest.VectorParams(
                    size=vector_size,
                    distance=rest.Distance.COSINE,
                )
            },
        )

        # Add payload indexes
        client.create_payload_index(
            collection_name=settings.qdrant_collection,
            field_name="user_id",
            field_schema=rest.PayloadSchemaType.KEYWORD,
        )

        client.create_payload_index(
            collection_name=settings.qdrant_collection,
            field_name="file_id",
            field_schema=rest.PayloadSchemaType.KEYWORD,
        )

ensure_collection()

# -------------------------------
# Helpers
# -------------------------------
def _chunk_hash(chunk: str) -> str:
    normalized = " ".join(chunk.split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _point_id(file_id: str, checksum: str, chunk_hash: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"{file_id}:{checksum}:{chunk_hash}"))


# -------------------------------
# Deduplication
# -------------------------------
def get_existing_chunk_points(
    file_id: str,
    checksum: str,
    chunks: list[str],
) -> dict[str, rest.Record]:
    if not chunks:
        return {}

    ids = [_point_id(file_id, checksum, _chunk_hash(chunk)) for chunk in chunks]

    records = client.retrieve(
        collection_name=settings.qdrant_collection,
        ids=ids,
        with_payload=True,
        with_vectors=True,
    )

    return {str(record.id): record for record in records}


# -------------------------------
# Upsert
# -------------------------------
def upsert_chunks(
    file_id: str,
    user_id: str,
    checksum: str,
    chunks: list[str],
    embeddings: list[list[float]],
) -> None:
    ensure_collection(len(embeddings[0]) if embeddings else VECTOR_SIZE)

    BATCH_SIZE = 20

    def build_point(idx: int, chunk: str, vector: list[float]) -> rest.PointStruct:
        chunk_hash = _chunk_hash(chunk)
        pid = _point_id(file_id, checksum, chunk_hash)

        return rest.PointStruct(
            id=pid,
            vector=cast(Any, {VECTOR_NAME: vector}),
            payload={
                "file_id": file_id,
                "user_id": user_id,
                "chunk_id": str(idx),
                "text": chunk[:500],  # trimmed payload
                "chunk_hash": chunk_hash,
                "checksum": checksum,
            },
        )

    points = [
        build_point(idx, chunk, vector)
        for idx, (chunk, vector) in enumerate(zip(chunks, embeddings))
    ]

    for i in range(0, len(points), BATCH_SIZE):
        batch = points[i : i + BATCH_SIZE]

        for attempt in range(5):
            try:
                client.upsert(
                    collection_name=settings.qdrant_collection,
                    points=batch,
                    wait=False,  # async indexing
                )
                time.sleep(0.2)
                break

            except Exception as e:
                if "timeout" in str(e).lower():
                    sleep = 2 ** attempt
                    print(f"[WARN] Upsert timeout. Retrying in {sleep}s...")
                    time.sleep(sleep)
                else:
                    raise

    # Debug visibility
    count = client.count(
        collection_name=settings.qdrant_collection,
        exact=True,
    )
    print(f"[INFO] Total vectors in collection: {count.count}")


# -------------------------------
# Search
# -------------------------------
def search(
    query_embedding: list[float],
    user_id: str,
    top_k: int,
    file_id: str | None = None,
):
    must = [
        rest.FieldCondition(
            key="user_id",
            match=rest.MatchValue(value=user_id),
        )
    ]

    if file_id:
        must.append(
            rest.FieldCondition(
                key="file_id",
                match=rest.MatchValue(value=file_id),
            )
        )

    query_filter = rest.Filter(must=cast(Any, must))

    search_space = client.count(
        collection_name=settings.qdrant_collection,
        count_filter=query_filter,
        exact=True,
    )

    results = client.search(
        collection_name=settings.qdrant_collection,
        query_vector=rest.NamedVector(name=VECTOR_NAME, vector=query_embedding),
        query_filter=query_filter,
        limit=top_k,
        with_payload=True,
    )

    top_hits = []
    for hit in results[: min(len(results), 3)]:
        payload = hit.payload or {}
        top_hits.append(
            {
                "documentId": payload.get("file_id", ""),
                "chunkId": payload.get("chunk_id", ""),
                "score": float(hit.score or 0.0),
                "text": str(payload.get("text", ""))[:200],
            }
        )

    log_payload = {
        "user_id": user_id,
        "file_id": file_id,
        "top_k": top_k,
        "search_space_count": int(search_space.count or 0),
        "hit_count": len(results),
        "top_hits": top_hits,
    }

    if results:
        logger.info("qdrant search returned hits", extra=log_payload)
    else:
        logger.warning("qdrant search returned no hits", extra=log_payload)

    return results