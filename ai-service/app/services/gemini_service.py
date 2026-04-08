from __future__ import annotations

import asyncio
import hashlib
import random
import threading
import time
from collections import OrderedDict
from typing import Any, cast

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

BASE_PROMPT = """
You are an AI Legal Assistant specializing in Indian law.

- Assume Indian jurisdiction.
- Cite relevant Acts (IPC, CrPC, CPC, Contract Act, Constitution, IT Act) with sections.
- Include case law where relevant.
- Be precise, structured, and analytical.

Format:
1. Facts
2. Issues
3. Law
4. Analysis
5. Conclusion
6. Note: "Informational only, not legal advice."

Rules:
- No definitive legal advice.
- State assumptions if facts are unclear.
- Acknowledge uncertainty where applicable.
"""

client: genai.Client | None = None
if settings.gemini_api_key:
    client = genai.Client(api_key=str(settings.gemini_api_key))

# Keep Gemini concurrency bounded so uploads and chat traffic cannot exhaust quota together.
ASYNC_SEMAPHORE = asyncio.Semaphore(max(2, min(int(settings.gemini_max_concurrency or 3), 5)))
SYNC_SEMAPHORE = threading.BoundedSemaphore(max(2, min(int(settings.gemini_max_concurrency or 3), 5)))
# Reuse embeddings for repeated chunks and repeated queries within the same process.
_EMBEDDING_CACHE: OrderedDict[str, list[float]] = OrderedDict()
_EMBEDDING_CACHE_LOCK = threading.Lock()
_METRICS_LOCK = threading.Lock()
_METRICS = {
    "requests": 0,
    "retries": 0,
    "rate_limited": 0,
    "input_tokens": 0,
    "output_tokens": 0,
    "total_tokens": 0,
}
_METRICS_WINDOW_STARTED = time.monotonic()


def _usage_dict(meta: Any, prompt: str, output: str) -> dict[str, int]:
    if not meta:
        return {
            "inputTokens": len(prompt) // 4,
            "outputTokens": len(output) // 4,
            "totalTokens": (len(prompt) + len(output)) // 4,
        }

    return {
        "inputTokens": int(getattr(meta, "prompt_token_count", 0) or 0),
        "outputTokens": int(getattr(meta, "candidates_token_count", 0) or 0),
        "totalTokens": int(getattr(meta, "total_token_count", 0) or 0),
    }


def _fallback_embedding(text: str, dim: int = 768) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    seed = int.from_bytes(digest[:8], "big")
    values = []
    state = seed
    for _ in range(dim):
        state = (1664525 * state + 1013904223) & 0xFFFFFFFF
        values.append((state / 0xFFFFFFFF) * 2 - 1)
    return values


def _cache_key(text: str) -> str:
    return hashlib.sha256(" ".join(text.split()).encode("utf-8")).hexdigest()


def _cache_embedding(key: str, vector: list[float]) -> None:
    max_cache_size = max(int(settings.gemini_embedding_cache_size or 0), 0)
    if max_cache_size <= 0:
        return

    with _EMBEDDING_CACHE_LOCK:
        _EMBEDDING_CACHE[key] = vector
        _EMBEDDING_CACHE.move_to_end(key)
        while len(_EMBEDDING_CACHE) > max_cache_size:
            _EMBEDDING_CACHE.popitem(last=False)


def _get_cached_embedding(key: str) -> list[float] | None:
    with _EMBEDDING_CACHE_LOCK:
        cached = _EMBEDDING_CACHE.get(key)
        if cached is None:
            return None
        _EMBEDDING_CACHE.move_to_end(key)
        return list(cached)


def _record_metrics(*, retries: int = 0, rate_limited: bool = False, usage: dict[str, int] | None = None) -> None:
    global _METRICS_WINDOW_STARTED

    with _METRICS_LOCK:
        _METRICS["requests"] += 1
        _METRICS["retries"] += retries
        if rate_limited:
            _METRICS["rate_limited"] += 1
        if usage:
            _METRICS["input_tokens"] += int(usage.get("inputTokens", 0) or 0)
            _METRICS["output_tokens"] += int(usage.get("outputTokens", 0) or 0)
            _METRICS["total_tokens"] += int(usage.get("totalTokens", 0) or 0)

        now = time.monotonic()
        if now - _METRICS_WINDOW_STARTED >= 60:
            logger.info("gemini request metrics", extra=dict(_METRICS))
            _METRICS.update(
                {
                    "requests": 0,
                    "retries": 0,
                    "rate_limited": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                }
            )
            _METRICS_WINDOW_STARTED = now


def _is_retryable_exception(exc: Exception) -> bool:
    message = str(exc).lower()
    return "429" in message or "resource_exhausted" in message or "rate limit" in message


async def _sleep_backoff(attempt: int) -> None:
    delay = min(
        float(settings.gemini_retry_max_delay or 12.0),
        (float(settings.gemini_retry_base_delay or 1.0) * (2**attempt)) + random.uniform(0, 1),
    )
    await asyncio.sleep(delay)


def _sleep_backoff_sync(attempt: int) -> None:
    delay = min(
        float(settings.gemini_retry_max_delay or 12.0),
        (float(settings.gemini_retry_base_delay or 1.0) * (2**attempt)) + random.uniform(0, 1),
    )
    time.sleep(delay)


def _normalize_history_item(item: dict[str, Any]) -> types.Content | None:
    role = str(item.get("role", "")).strip().lower()
    content = str(item.get("content", "")).strip()

    if not content:
        return None

    if role not in {"user", "assistant"}:
        return None

    return types.Content(
        role="model" if role == "assistant" else "user",
        parts=[types.Part.from_text(text=content)],
    )


def _trim_history(history: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    if not history:
        return []

    max_messages = max(int(settings.max_history_messages or 0), 0)
    max_chars = max(int(settings.max_history_chars or 0), 0)
    recent_history = history[-max_messages:] if max_messages else list(history)

    if max_chars <= 0:
        return recent_history

    trimmed: list[dict[str, Any]] = []
    total_chars = 0

    for item in reversed(recent_history):
        content = str(item.get("content", "")).strip()
        if not content:
            continue

        item_chars = len(content)
        if trimmed and total_chars + item_chars > max_chars:
            break

        trimmed.append(item)
        total_chars += item_chars

        if total_chars >= max_chars:
            break

    return list(reversed(trimmed))


def _truncate_text(text: str, limit: int) -> str:
    cleaned = str(text).strip()
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: max(limit - 3, 0)].rstrip() + "..."


def _prepare_context_snippets(contexts: list[str] | None) -> list[str]:
    if not contexts:
        return []

    cleaned_contexts = [str(ctx).strip() for ctx in contexts if str(ctx).strip()]
    if not cleaned_contexts:
        return []

    max_chunks = max(int(settings.gemini_context_chunk_limit or 0), 0)
    max_context_chars = max(int(settings.gemini_context_char_limit or 0), 0)
    max_chunk_chars = max(int(settings.gemini_context_chunk_chars or 0), 0)

    selected_contexts = cleaned_contexts[:max_chunks] if max_chunks else cleaned_contexts
    formatted_chunks: list[str] = []
    total_chars = 0

    for idx, ctx in enumerate(selected_contexts):
        snippet = _truncate_text(ctx, max_chunk_chars) if max_chunk_chars else ctx
        candidate = f"[{idx + 1}] {snippet}"
        if max_context_chars and total_chars + len(candidate) > max_context_chars:
            break
        formatted_chunks.append(candidate)
        total_chars += len(candidate)

    return formatted_chunks


def _format_context_block(contexts: list[str] | None) -> str:
    formatted_chunks = _prepare_context_snippets(contexts)
    if not formatted_chunks:
        return ""

    context_text = "\n\n".join(formatted_chunks)

    return (
        "Use the following retrieved context while answering. "
        "If it is insufficient, clearly say what is missing.\n\n"
        f"Context:\n{context_text}"
    )


def _build_contents(
    user_query: str,
    history: list[dict[str, Any]] | None = None,
    contexts: list[str] | None = None,
) -> list[types.Content]:
    contents: list[types.Content] = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=BASE_PROMPT.strip())],
        )
    ]

    normalized_history = _trim_history(history)
    for item in normalized_history:
        normalized = _normalize_history_item(item)
        if normalized is None:
            continue
        contents.append(normalized)

    context_snippets = _prepare_context_snippets(contexts)
    context_block = ""
    if context_snippets:
        context_text = "\n\n".join(context_snippets)
        context_block = (
            "Use the following retrieved context while answering. "
            "If it is insufficient, clearly say what is missing.\n\n"
            f"Context:\n{context_text}"
        )

        logger.info(
            "rag context injected",
            extra={
                "context_chunk_count": len(context_snippets),
                "context_chunks": context_snippets,
            },
        )

    if context_block:
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=context_block)],
            )
        )

    if user_query.strip():
        if not (
            normalized_history
            and str(normalized_history[-1].get("role", "")).strip().lower() == "user"
            and str(normalized_history[-1].get("content", "")).strip() == user_query.strip()
        ):
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=user_query)],
                )
            )

    return contents


def _response_text(response: Any) -> str:
    text = getattr(response, "text", None) or ""
    if text:
        return text
    return "No response generated."


def _extract_embeddings(response: Any) -> list[list[float]]:
    embeddings = getattr(response, "embeddings", None) or []
    values: list[list[float]] = []
    for embedding in embeddings:
        vector = getattr(embedding, "values", None)
        values.append(list(vector) if vector else [])
    return values


async def _embed_content_async(texts: list[str], task_type: str) -> list[list[float]]:
    gemini_client = client
    if not gemini_client:
        logger.warning("embed_content fallback: Gemini client not configured")
        return [_fallback_embedding(text) for text in texts]

    async def call_once() -> Any:
        async with ASYNC_SEMAPHORE:
            return await gemini_client.aio.models.embed_content(
                model=settings.gemini_embed_model,
                contents=cast(Any, texts),
                config=types.EmbedContentConfig(task_type=task_type),
            )

    last_error: Exception | None = None
    retries = max(int(settings.gemini_retry_attempts or 0), 0)
    for attempt in range(retries + 1):
        try:
            response = await call_once()
            vectors = _extract_embeddings(response)
            if len(vectors) != len(texts):
                logger.warning("embed_content returned an unexpected batch size")
                vectors = vectors[: len(texts)]
                while len(vectors) < len(texts):
                    vectors.append(_fallback_embedding(texts[len(vectors)]))
            for text, vector in zip(texts, vectors, strict=False):
                _cache_embedding(_cache_key(text), vector)
            _record_metrics()
            return vectors
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if not _is_retryable_exception(exc) or attempt >= retries:
                break
            logger.warning("Gemini embedding request rate limited; retrying", extra={"attempt": attempt + 1})
            _record_metrics(retries=1, rate_limited=True)
            await _sleep_backoff(attempt)

    logger.exception("embed_content failed; using deterministic fallback embeddings", exc_info=last_error)
    return [_fallback_embedding(text) for text in texts]


def _embed_content_sync(texts: list[str], task_type: str) -> list[list[float]]:
    gemini_client = client
    if not gemini_client:
        logger.warning("embed_content fallback: Gemini client not configured")
        return [_fallback_embedding(text) for text in texts]

    def call_once() -> Any:
        with SYNC_SEMAPHORE:
            return gemini_client.models.embed_content(
                model=settings.gemini_embed_model,
                contents=cast(Any, texts),
                config=types.EmbedContentConfig(task_type=task_type),
            )

    last_error: Exception | None = None
    retries = max(int(settings.gemini_retry_attempts or 0), 0)
    for attempt in range(retries + 1):
        try:
            response = call_once()
            vectors = _extract_embeddings(response)
            if len(vectors) != len(texts):
                logger.warning("embed_content returned an unexpected batch size")
                vectors = vectors[: len(texts)]
                while len(vectors) < len(texts):
                    vectors.append(_fallback_embedding(texts[len(vectors)]))
            for text, vector in zip(texts, vectors, strict=False):
                _cache_embedding(_cache_key(text), vector)
            _record_metrics()
            return vectors
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if not _is_retryable_exception(exc) or attempt >= retries:
                break
            logger.warning("Gemini embedding request rate limited; retrying", extra={"attempt": attempt + 1})
            _record_metrics(retries=1, rate_limited=True)
            _sleep_backoff_sync(attempt)

    logger.exception("embed_content failed; using deterministic fallback embeddings", exc_info=last_error)
    return [_fallback_embedding(text) for text in texts]


async def embed_text(text: str) -> list[float]:
    vectors = await embed_texts([text], task_type="RETRIEVAL_QUERY")
    return vectors[0] if vectors else _fallback_embedding(text)


def embed_text_sync(text: str) -> list[float]:
    vectors = embed_texts_sync([text], task_type="RETRIEVAL_DOCUMENT")
    return vectors[0] if vectors else _fallback_embedding(text)


async def embed_texts(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    normalized_texts = [str(text).strip() for text in texts if str(text).strip()]
    if not normalized_texts:
        return []

    results: list[list[float] | None] = [None] * len(normalized_texts)
    missing_indices: list[int] = []
    missing_texts: list[str] = []

    for index, text in enumerate(normalized_texts):
        cached = _get_cached_embedding(_cache_key(text))
        if cached is not None:
            results[index] = cached
            continue
        missing_indices.append(index)
        missing_texts.append(text)

    if missing_texts:
        batch_size = max(int(settings.gemini_embedding_batch_size or 0), 1)
        missing_vectors: list[list[float]] = []
        for start in range(0, len(missing_texts), batch_size):
            batch = missing_texts[start:start + batch_size]
            batch_vectors = await _embed_content_async(batch, task_type=task_type)
            missing_vectors.extend(batch_vectors)

        for index, vector in zip(missing_indices, missing_vectors, strict=False):
            results[index] = vector

    final_vectors: list[list[float]] = []
    for text, vector in zip(normalized_texts, results, strict=False):
        final_vectors.append(vector if vector is not None else _fallback_embedding(text))
    return final_vectors


def embed_texts_sync(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    normalized_texts = [str(text).strip() for text in texts if str(text).strip()]
    if not normalized_texts:
        return []

    results: list[list[float] | None] = [None] * len(normalized_texts)
    missing_indices: list[int] = []
    missing_texts: list[str] = []

    for index, text in enumerate(normalized_texts):
        cached = _get_cached_embedding(_cache_key(text))
        if cached is not None:
            results[index] = cached
            continue
        missing_indices.append(index)
        missing_texts.append(text)

    if missing_texts:
        batch_size = max(int(settings.gemini_embedding_batch_size or 0), 1)
        missing_vectors: list[list[float]] = []
        for start in range(0, len(missing_texts), batch_size):
            batch = missing_texts[start:start + batch_size]
            batch_vectors = _embed_content_sync(batch, task_type=task_type)
            missing_vectors.extend(batch_vectors)

        for index, vector in zip(missing_indices, missing_vectors, strict=False):
            results[index] = vector

    final_vectors: list[list[float]] = []
    for text, vector in zip(normalized_texts, results, strict=False):
        final_vectors.append(vector if vector is not None else _fallback_embedding(text))
    return final_vectors


async def generate_answer(
    prompt: str,
    history: list[dict[str, Any]] | None = None,
    contexts: list[str] | None = None,
) -> tuple[str, dict[str, int]]:
    gemini_client = client
    if not gemini_client:
        logger.warning("generate_answer fallback: Gemini client not configured")
        answer = "Gemini API key is not configured. This is a fallback response."
        usage = {
            "inputTokens": len(prompt) // 4,
            "outputTokens": len(answer) // 4,
            "totalTokens": (len(prompt) + len(answer)) // 4,
        }
        return answer, usage

    async def call_once() -> Any:
        async with ASYNC_SEMAPHORE:
            return await gemini_client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=cast(Any, _build_contents(prompt, history=history, contexts=contexts)),
            )

    last_error: Exception | None = None
    retries = max(int(settings.gemini_retry_attempts or 0), 0)
    for attempt in range(retries + 1):
        try:
            response = await call_once()
            text = _response_text(response)
            usage = _usage_dict(getattr(response, "usage_metadata", None), prompt, text)
            _record_metrics(usage=usage)
            return text, usage
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if not _is_retryable_exception(exc) or attempt >= retries:
                break
            logger.warning("Gemini generation request rate limited; retrying", extra={"attempt": attempt + 1})
            _record_metrics(retries=1, rate_limited=True)
            await _sleep_backoff(attempt)

    logger.exception("generate_answer failed; returning fallback response", exc_info=last_error)
    answer = "Gemini is temporarily rate limited. Please retry in a moment."
    usage = {
        "inputTokens": len(prompt) // 4,
        "outputTokens": len(answer) // 4,
        "totalTokens": (len(prompt) + len(answer)) // 4,
    }
    _record_metrics(usage=usage)
    return answer, usage


async def iter_answer_chunks(
    prompt: str,
    usage_container: dict[str, int] | None = None,
    history: list[dict[str, Any]] | None = None,
    contexts: list[str] | None = None,
):
    usage_ref = usage_container if usage_container is not None else {}
    gemini_client = client

    if not gemini_client:
        logger.warning("iter_answer_chunks fallback: Gemini client not configured")
        answer = "Gemini API key is not configured. This is a fallback response."
        usage_ref.update(_usage_dict(None, prompt, answer))
        for token in answer.split(" "):
            yield f"{token} "
        return

    last_error: Exception | None = None
    retries = max(int(settings.gemini_retry_attempts or 0), 0)
    output_parts: list[str] = []

    for attempt in range(retries + 1):
        try:
            async with ASYNC_SEMAPHORE:
                stream = await gemini_client.aio.models.generate_content_stream(
                    model=settings.gemini_model,
                    contents=cast(Any, _build_contents(prompt, history=history, contexts=contexts)),
                )

                logger.info("gemini stream opened")
                output_parts = []

                async for chunk in stream:
                    text = (getattr(chunk, "text", "") or "").strip("\x00")
                    if not text:
                        continue
                    output_parts.append(text)
                    yield text

                output_text = "".join(output_parts)
                stream_response = getattr(stream, "response", None)
                meta = getattr(stream_response, "usage_metadata", None)
                usage_ref.update(_usage_dict(meta, prompt, output_text))
                _record_metrics(usage=usage_ref)
                logger.info("gemini stream completed", extra={"output_chars": len(output_text)})
                return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if not _is_retryable_exception(exc) or attempt >= retries:
                break
            logger.warning("Gemini stream rate limited; retrying", extra={"attempt": attempt + 1})
            _record_metrics(retries=1, rate_limited=True)
            await _sleep_backoff(attempt)

    logger.exception("gemini stream failed; returning fallback message", exc_info=last_error)
    fallback = "Gemini is temporarily rate limited. Please retry in a moment."
    if not output_parts:
        for token in fallback.split(" "):
            yield f"{token} "
    output_text = "".join(output_parts) or fallback
    usage_ref.update(_usage_dict(None, prompt, output_text))
    _record_metrics(usage=usage_ref)