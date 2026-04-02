from __future__ import annotations

from app.core.config import get_settings
from app.core.logger import logger
from app.services.gemini_service import embed_text, generate_answer, iter_answer_chunks
from app.services.vector_store import search

settings = get_settings()


def _build_prompt(query: str, contexts: list[str]) -> str:
    context_block = "\n\n".join(f"[{i+1}] {ctx}" for i, ctx in enumerate(contexts))
    return (
        "You are Legal Helper, an AI legal assistant. "
        "Answer clearly and avoid inventing legal facts. "
        "If the context is insufficient, say so.\n\n"
        f"Context:\n{context_block}\n\n"
        f"User question: {query}\n\n"
        "Provide a practical and concise answer."
    )


def run_rag(query: str, user_id: str, top_k: int, file_id: str | None = None):
    logger.info("run_rag started", extra={"user_id": user_id, "file_id": file_id})
    qvec = embed_text(query)
    hits = search(qvec, user_id=user_id, top_k=top_k, file_id=file_id)

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

    prompt = _build_prompt(query, contexts)
    answer, usage = generate_answer(prompt)

    logger.info(
        "run_rag completed",
        extra={"user_id": user_id, "hits": len(hits), "citation_count": len(citations)},
    )

    return {
        "answer": answer,
        "citations": citations,
        "tokenUsage": usage
    }


def run_rag_stream(
    query: str,
    user_id: str,
    top_k: int,
    file_id: str | None = None,
    history: list[dict] | None = None,
):
    logger.info("run_rag_stream started", extra={"user_id": user_id, "file_id": file_id})
    qvec = embed_text(query)
    hits = search(qvec, user_id=user_id, top_k=top_k, file_id=file_id)

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

    prompt = _build_prompt(query, contexts)
    usage: dict[str, int] = {}
    effective_history = history or []

    if (
        effective_history
        and str(effective_history[-1].get("role", "")).strip().lower() == "user"
        and str(effective_history[-1].get("content", "")).strip() == query.strip()
    ):
        effective_history = effective_history[:-1]

    for chunk in iter_answer_chunks(
        prompt,
        usage_container=usage,
        history=effective_history,
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
