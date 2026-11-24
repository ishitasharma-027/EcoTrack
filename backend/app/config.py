import os
import tempfile
from pathlib import Path

from pydantic_settings import BaseSettings

os.environ.setdefault("MPLCONFIGDIR", tempfile.gettempdir())
os.environ.setdefault("YOLO_CONFIG_DIR", tempfile.gettempdir())


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "ecotrack"
    jwt_secret: str = "ecotrack-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    upload_dir: str = "../uploads"
    illegal_waste_model: str = "../AI/illegal_waste/best.pt"
    segregation_model: str = "../AI/segregation/best_model_epoch_12.pth"
    cors_origins: str = "http://localhost:3000"
    admin_email: str = "admin@ecotrack.com"
    admin_password: str = "Admin@123"
    environment: str = "development"
    docs_enabled: bool = True
    max_upload_bytes: int = 10 * 1024 * 1024
    illegal_waste_model_url: str = ""
    segregation_model_url: str = ""
    illegal_waste_model_sha256: str = ""
    segregation_model_sha256: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        if not path.is_absolute():
            path = Path(__file__).resolve().parent.parent / path
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
