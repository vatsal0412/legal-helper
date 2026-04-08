from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    app_port: int = 8000

    gemini_api_key: str = "AIzaSyAbYgf5Alrs3uB-h3Mh1lTH5lcEx1u662w"
    gemini_model: str = "gemini-3-flash-preview"
    gemini_embed_model: str = "gemini-embedding-001"
    gemini_max_concurrency: int = 3
    gemini_retry_attempts: int = 5
    gemini_retry_base_delay: float = 1.0
    gemini_retry_max_delay: float = 12.0
    gemini_embedding_batch_size: int = 8
    gemini_embedding_cache_size: int = 4096
    gemini_context_chunk_limit: int = 5
    gemini_context_char_limit: int = 8000
    gemini_context_chunk_chars: int = 1000

    qdrant_url: str = "https://8de1ab5e-0922-41f1-95c9-f34f2cdbe73a.sa-east-1-0.aws.cloud.qdrant.io"
    qdrant_api_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.9h4Sm3Foteen4-2I9z-C_y1Tu2eT_G0rOSMsakB8-jY"
    qdrant_collection: str = "rag_documents"

    backend_url: str = "http://localhost:4000"
    internal_api_key: str = "gYyBxw3960hwPKxbfLzk7osHHHz1a3H2"

    top_k: int = 5
    chunk_size: int = 1200
    chunk_overlap: int = 200
    max_history_messages: int = 24
    max_history_chars: int = 12000


@lru_cache
def get_settings() -> Settings:
    return Settings()
