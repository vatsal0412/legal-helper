import json

from fastapi import APIRouter, BackgroundTasks, File, Form, Request, UploadFile
from fastapi.responses import StreamingResponse

from app.core.logger import logger
from app.schemas.chat import ChatRequest
from app.services.ingestion import process_document
from app.services.rag import run_rag_stream

router = APIRouter()

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    file_id: str = Form(...),
    user_id: str = Form(...),
    checksum: str = Form(...)
):
    file_bytes = await file.read()
    logger.info("upload accepted", extra={"file_id": file_id, "user_id": user_id})
    background_tasks.add_task(
        process_document,
        file_bytes,
        file.filename or "uploaded-document",
        file_id,
        user_id,
        checksum,
    )
    return {"message": "Processing started", "fileId": file_id}


def sse(event: str, data: dict):
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, http_request: Request):
    logger.info(
        "chat stream started",
        extra={
            "session_id": request.sessionId,
            "user_id": request.userId,
            "file_id": request.fileId,
        },
    )

    async def event_generator():
        try:
            async for event in run_rag_stream(
                query=request.query,
                user_id=request.userId,
                top_k=5,
                file_id=request.fileId,
                history=[item.model_dump() for item in request.history],
            ):
                if await http_request.is_disconnected():
                    logger.info(
                        "chat stream disconnected",
                        extra={"session_id": request.sessionId, "user_id": request.userId},
                    )
                    return

                event_name = event.get("event")
                if event_name == "delta":
                    text = event.get("text", "")
                    if not text:
                        continue
                    yield sse("delta", {"text": text})
                    continue

                if event_name == "done":
                    logger.info(
                        "rag stream completed",
                        extra={"session_id": request.sessionId, "user_id": request.userId},
                    )
                    yield sse(
                        "done",
                        {
                            "tokenUsage": event.get("tokenUsage", {}),
                            "citations": event.get("citations", []),
                        },
                    )
            return
        except Exception as exc:  # noqa: BLE001
            logger.exception(
                "chat stream failed",
                extra={"session_id": request.sessionId, "user_id": request.userId},
            )
            yield sse("error", {"message": str(exc)})

    return StreamingResponse(event_generator(), media_type="text/event-stream")