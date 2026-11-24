import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


async def save_upload(file: UploadFile, subfolder: str = "") -> str:
    content_type = (file.content_type or "").lower()
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext == ".jpeg":
        ext = ".jpg"

    if content_type not in ALLOWED_IMAGE_TYPES and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Upload a JPEG, PNG, or WebP image.",
        )

    if ext not in ALLOWED_EXTENSIONS:
        ext = ALLOWED_IMAGE_TYPES.get(content_type, ".jpg")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image exceeds the maximum upload size of 10 MB.",
        )

    filename = f"{uuid.uuid4().hex}{ext}"
    folder = settings.upload_path / subfolder
    folder.mkdir(parents=True, exist_ok=True)
    filepath = folder / filename

    async with aiofiles.open(filepath, "wb") as out:
        await out.write(content)

    rel = f"{subfolder}/{filename}" if subfolder else filename
    return rel.replace("\\", "/")
