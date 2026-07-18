import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.config import settings


async def save_upload(file: UploadFile, subfolder: str = "") -> str:
    ext = Path(file.filename or "image.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    folder = settings.upload_path / subfolder
    folder.mkdir(parents=True, exist_ok=True)
    filepath = folder / filename

    async with aiofiles.open(filepath, "wb") as out:
        content = await file.read()
        await out.write(content)

    rel = f"{subfolder}/{filename}" if subfolder else filename
    return rel.replace("\\", "/")
