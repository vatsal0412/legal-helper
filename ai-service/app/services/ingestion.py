from __future__ import annotations

import hashlib
from uuid import NAMESPACE_URL, uuid5

import httpx
from app.core.config import get_settings
from app.core.logger import logger
from app.services.gemini_service import embed_texts_sync
from app.services.vector_store import get_existing_chunk_points, upsert_chunks
from app.utils.extractors import extract_text
from app.utils.text import chunk_text

settings = get_settings()


def _chunk_hash(chunk: str) -> str:
    normalized = " ".join(chunk.split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _point_id(file_id: str, checksum: str, chunk: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"{file_id}:{checksum}:{_chunk_hash(chunk)}"))


def _notify_backend(document_id: str, status: str, error: str = "") -> None:
    payload = {"documentId": document_id, "status": status, "error": error}
    url = f"{settings.backend_url}/api/documents/internal/status"
    headers = {"x-internal-api-key": settings.internal_api_key}

    with httpx.Client(timeout=20) as client:
        client.post(url, json=payload, headers=headers)


def process_document(file_bytes: bytes, filename: str, file_id: str, user_id: str, checksum: str) -> None:
    try:
        _notify_backend(file_id, "processing")
        text = extract_text(filename, file_bytes)
        if not text.strip():
            raise ValueError("No extractable text found")

        chunks = chunk_text(text, settings.chunk_size, settings.chunk_overlap)
        if not chunks:
            raise ValueError("No chunks generated from document")

        # Reuse Qdrant vectors first so identical chunks do not trigger duplicate embedding calls.
        existing_points = get_existing_chunk_points(file_id=file_id, checksum=checksum, chunks=chunks)
        embeddings: list[list[float] | None] = [None] * len(chunks)
        missing_chunks: list[str] = []
        missing_indices: list[int] = []

        for index, chunk in enumerate(chunks):
            point_id = _point_id(file_id, checksum, chunk)
            point = existing_points.get(point_id)
            if point is not None:
                vector = getattr(point, "vector", None)
                if isinstance(vector, list) and vector:
                    embeddings[index] = vector
                    continue

            missing_indices.append(index)
            missing_chunks.append(chunk)

        if missing_chunks:
            embedded_chunks = embed_texts_sync(missing_chunks, task_type="RETRIEVAL_DOCUMENT")
            for index, vector in zip(missing_indices, embedded_chunks, strict=False):
                embeddings[index] = vector

        final_embeddings = [vector if vector is not None else [] for vector in embeddings]
        upsert_chunks(file_id=file_id, user_id=user_id, checksum=checksum, chunks=chunks, embeddings=final_embeddings)

        _notify_backend(file_id, "completed")
        logger.info("Document processed", extra={"file_id": file_id, "chunks": len(chunks)})
    except Exception as exc:
        logger.exception("Document processing failed", exc_info=exc)
        _notify_backend(file_id, "failed", str(exc))
