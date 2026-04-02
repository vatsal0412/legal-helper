from __future__ import annotations

import hashlib
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


def _build_contents(
    user_query: str,
    history: list[dict[str, Any]] | None = None,
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


def embed_text(text: str) -> list[float]:
    if not client:
        logger.warning("embed_text fallback: Gemini client not configured")
        return _fallback_embedding(text)

    response = client.models.embed_content(
        model=settings.gemini_embed_model,
        contents=text,
    )
    embeddings = getattr(response, "embeddings", None) or []
    first = embeddings[0] if embeddings else None
    values = getattr(first, "values", None)
    if values:
        return list(values)
    logger.warning("embed_text fallback: empty embedding response")
    return _fallback_embedding(text)


def generate_answer(
    prompt: str,
    history: list[dict[str, Any]] | None = None,
) -> tuple[str, dict[str, int]]:
    if not client:
        logger.warning("generate_answer fallback: Gemini client not configured")
        answer = "Gemini API key is not configured. This is a fallback response."
        usage = {
            "inputTokens": len(prompt) // 4,
            "outputTokens": len(answer) // 4,
            "totalTokens": (len(prompt) + len(answer)) // 4,
        }
        return answer, usage

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=cast(Any, _build_contents(prompt, history=history)),
    )
    text = response.text or "No response generated."
    meta = response.usage_metadata
    usage = _usage_dict(meta, prompt, text)
    return text, usage


def iter_answer_chunks(
    prompt: str,
    usage_container: dict[str, int] | None = None,
    history: list[dict[str, Any]] | None = None,
):
    usage_ref = usage_container if usage_container is not None else {}

    if not client:
        logger.warning("iter_answer_chunks fallback: Gemini client not configured")
        answer = "Gemini API key is not configured. This is a fallback response."
        usage_ref.update(_usage_dict(None, prompt, answer))
        for token in answer.split(" "):
            yield f"{token} "
        return

    stream = client.models.generate_content_stream(
        model="gemini-3-flash-preview",
        contents=cast(Any, _build_contents(prompt, history=history)),
    )

    logger.info("gemini stream opened")

    output_parts: list[str] = []
    for chunk in stream:
        text = (getattr(chunk, "text", "") or "").strip("\x00")
        if not text:
            continue
        output_parts.append(text)
        yield text

    output_text = "".join(output_parts)
    stream_response = getattr(stream, "response", None)
    meta = getattr(stream_response, "usage_metadata", None)
    usage_ref.update(_usage_dict(meta, prompt, output_text))
    logger.info("gemini stream completed", extra={"output_chars": len(output_text)})