from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ttt_db"
    SECRET_KEY: str = "change-me-in-production-must-be-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "https://paddleclash.vercel.app",
    ]

    class Config:
        env_file = ".env"

settings = Settings()
