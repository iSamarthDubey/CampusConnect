from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusConnect API"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # Auth
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Faculty domain (optional)
    FACULTY_EMAIL_DOMAIN: str = ""
    
    # Database
    DATABASE_URL: str  # postgres connection string from Supabase
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

