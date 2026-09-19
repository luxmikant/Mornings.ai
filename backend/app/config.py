"""
Agentic PR Manager — Application Configuration

Loads all settings from environment variables using Pydantic BaseSettings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────
    app_name: str = "Agentic PR Manager"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-in-production"
    api_v1_prefix: str = "/api/v1"

    # ── Database ─────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/agentic_pr_manager"

    # ── Redis ────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── AWS Bedrock AgentCore ────────────────────────────
    aws_region: str = "ap-south-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    bedrock_agent_id: str = ""
    bedrock_agent_alias_id: str = ""
    bedrock_model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"
    bedrock_image_model_id: str = "amazon.titan-image-generator-v2:0"
    bedrock_embed_model_id: str = "amazon.titan-embed-text-v2:0"

    # ── Third-Party Model Providers ──────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    nvidia_api_key: str = ""
    nvidia_image_model: str = "qwen-image"

    # ── Cloudflare R2 ────────────────────────────────────
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "agentic-pr-manager"
    r2_endpoint_url: str = ""
    r2_public_url: str = ""

    # ── Firebase ─────────────────────────────────────────
    firebase_credentials_path: str = "./firebase-service-account.json"

    # ── Scheduling ───────────────────────────────────────
    batch_generation_cron_hour: int = 2
    batch_generation_cron_minute: int = 30
    dispatch_cron_hour: int = 6
    dispatch_cron_minute: int = 0
    timezone: str = "Asia/Kolkata"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
