"""
Application Configuration Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "LangLearn"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:tiger@localhost:5432/language_learning_db"
    
    # JWT Settings
    SECRET_KEY: str = "your-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Frontend and CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    
    # Supported Languages
    SUPPORTED_LANGUAGES: List[str] = ["English", "German", "Spanish", "Hindi", "French", "Japanese"]
    
    # Language Codes Mapping
    LANGUAGE_CODES: dict = {
        "English": "en",
        "German": "de",
        "Spanish": "es",
        "Hindi": "hi",
        "French": "fr",
        "Japanese": "ja"
    }
    
    # XP Thresholds for Levels
    LEVEL_XP_THRESHOLDS: dict = {
        "A1": 500,
        "A2": 1000,
        "B1": 2000,
        "B2": 3500,
        "C1": 5000,
        "C2": 8000
    }
    
    # XP Rewards
    XP_CORRECT: int = 10
    XP_PARTIAL: int = 5
    XP_WRONG: int = 0
    XP_STREAK_BONUS: int = 20

    OPENAI_API_KEY: str = ""

    def get_cors_origins(self) -> List[str]:
        """Return CORS origins as a normalized list from comma-separated env value."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"

settings = Settings()
