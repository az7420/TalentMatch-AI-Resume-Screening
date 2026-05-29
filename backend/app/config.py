"""
TalentMatch AI - Application Configuration
Centralized settings management using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "TalentMatch AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://talentmatch-ai.vercel.app",
    ]

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/talentmatch"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # JWT Authentication
    SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_RESUME_TYPES: list[str] = [".pdf", ".doc", ".docx"]
    ALLOWED_JD_TYPES: list[str] = [".pdf", ".docx", ".txt"]

    # AI / ML Settings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    OPENAI_API_KEY: Optional[str] = None
    USE_OPENAI_EMBEDDINGS: bool = False

    # Scoring Weights (must sum to 1.0)
    WEIGHT_EMBEDDING_SIMILARITY: float = 0.50
    WEIGHT_SKILL_MATCH: float = 0.20
    WEIGHT_EXPERIENCE: float = 0.15
    WEIGHT_EDUCATION: float = 0.10
    WEIGHT_PROJECT_RELEVANCE: float = 0.05

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # AWS S3 (optional, for future migration)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    USE_S3_STORAGE: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{settings.UPLOAD_DIR}/resumes", exist_ok=True)
os.makedirs(f"{settings.UPLOAD_DIR}/jd", exist_ok=True)
