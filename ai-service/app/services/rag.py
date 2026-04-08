from __future__ import annotations

import asyncio

from app.core.config import get_settings
from app.core.logger import logger
from app.services.gemini_service import embed_text, generate_answer, iter_answer_chunks
from app.services.vector_store import search

settings = get_settings()


async def run_rag(query: str, user_id: str, top_k: int, file_id: str | None = None):
    logger.info("run_rag started", extra={"user_id": user_id, "file_id": file_id})
    qvec = await embed_text(query)
    # Keep retrieval narrow so the generation prompt stays within a stable size.
    effective_top_k = max(1, min(int(top_k or 0), 5))
    hits = await asyncio.to_thread(search, qvec, user_id=user_id, top_k=effective_top_k, file_id=file_id)

    contexts = []
    citations = []
    for hit in hits:
        payload = hit.payload or {}
        text = payload.get("text", "")
        contexts.append(text)
        citations.append(
            {
                "documentId": payload.get("file_id", ""),
                "chunkId": payload.get("chunk_id", ""),
                "text": text[:300],
                "score": float(hit.score or 0.0)
            }
        )

    if contexts:
        logger.info(
            "run_rag context prepared",
            extra={
                "user_id": user_id,
                "file_id": file_id,
                "hit_count": len(hits),
                "context_count": len(contexts),
                "context_preview": [text[:200] for text in contexts[:3]],
            },
        )
    else:
        logger.warning(
            "run_rag found no retrievable context",
            extra={"user_id": user_id, "file_id": file_id, "hit_count": len(hits)},
        )

    answer, usage = await generate_answer(query, contexts=contexts)

    logger.info(
        "run_rag completed",
        extra={"user_id": user_id, "hits": len(hits), "citation_count": len(citations)},
    )

    return {
        "answer": answer,
        "citations": citations,
        "tokenUsage": usage
    }


async def run_rag_stream(
    query: str,
    user_id: str,
    top_k: int,
    file_id: str | None = None,
    history: list[dict] | None = None,
):
    logger.info("run_rag_stream started", extra={"user_id": user_id, "file_id": file_id})
    qvec = await embed_text(query)
    # Keep retrieval narrow so the generation prompt stays within a stable size.
    effective_top_k = max(1, min(int(top_k or 0), 5))
    hits = await asyncio.to_thread(search, qvec, user_id=user_id, top_k=effective_top_k, file_id=file_id)

    contexts = []
    citations = []
    for hit in hits:
        payload = hit.payload or {}
        text = payload.get("text", "")
        contexts.append(text)
        citations.append(
            {
                "documentId": payload.get("file_id", ""),
                "chunkId": payload.get("chunk_id", ""),
                "text": text[:300],
                "score": float(hit.score or 0.0),
            }
        )

    if contexts:
        logger.info(
            "run_rag_stream context prepared",
            extra={
                "user_id": user_id,
                "file_id": file_id,
                "hit_count": len(hits),
                "context_count": len(contexts),
                "context_preview": [text[:200] for text in contexts[:3]],
            },
        )
    else:
        logger.warning(
            "run_rag_stream found no retrievable context",
            extra={"user_id": user_id, "file_id": file_id, "hit_count": len(hits)},
        )

    usage: dict[str, int] = {}
    effective_history = history or []

    if (
        effective_history
        and str(effective_history[-1].get("role", "")).strip().lower() == "user"
        and str(effective_history[-1].get("content", "")).strip() == query.strip()
    ):
        effective_history = effective_history[:-1]

    async for chunk in iter_answer_chunks(
        query,
        usage_container=usage,
        history=effective_history,
        contexts=contexts,
    ):
        yield {"event": "delta", "text": chunk}

    logger.info(
        "run_rag_stream completed",
        extra={"user_id": user_id, "hits": len(hits), "citation_count": len(citations)},
    )
    yield {
        "event": "done",
        "tokenUsage": usage,
        "citations": citations,
    }
