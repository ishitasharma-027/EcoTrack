from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.config import settings
from app.services.ai_service import detect_illegal_waste, run_segregation
from app.utils.files import save_upload

router = APIRouter(prefix="/api", tags=["AI Detection"])


def _resolve_image(relative_path: str) -> Path:
    return settings.upload_path / relative_path.replace("/", "\\")


@router.post("/detect-illegal-waste")
async def detect_illegal_waste_endpoint(file: UploadFile = File(...)):
    saved = await save_upload(file, "complaints")
    image_path = _resolve_image(saved)
    result = detect_illegal_waste(image_path)
    result["image"] = saved
    return result


@router.post("/segregation")
async def segregation_endpoint(file: UploadFile = File(...)):
    saved = await save_upload(file, "segregation")
    image_path = _resolve_image(saved)
    result = run_segregation(image_path)
    result["image"] = saved
    return result
