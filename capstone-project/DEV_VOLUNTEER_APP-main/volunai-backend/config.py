# FIX BUG-21: removed duplicate import
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    # FIX BUG-02: removed insecure hardcoded fallback secrets.
    # Server will refuse to start if these are not set in the environment.
    SECRET_KEY = os.environ.get("SECRET_KEY")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    if not SECRET_KEY or not JWT_SECRET_KEY:
        raise RuntimeError(
            "SECURITY ERROR: SECRET_KEY and JWT_SECRET_KEY must be set "
            "as environment variables. Do not use hardcoded defaults."
        )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File Uploads
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
    
    # S3 Config (Optional for now)
    S3_BUCKET = os.environ.get("S3_BUCKET_NAME")
    AWS_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID")
    AWS_SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
    USE_S3 = os.environ.get("USE_S3", "false").lower() == "true"


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///volunai.db")


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    # In production, prioritize the DATABASE_URL environment variable (e.g., PostgreSQL)
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///volunai.db")


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig
}
