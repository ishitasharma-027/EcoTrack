import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/segregation", tags=["Segregation"])


@router.post("/history")
async def save_history(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    record_id = str(uuid.uuid4())
    doc = {
        "_id": record_id,
        "user_id": current_user["_id"],
        "image": payload.get("image"),
        "category": payload.get("category"),
        "confidence": payload.get("confidence"),
        "disposal_bin": payload.get("disposal_bin"),
        "disposal_guide": payload.get("disposal_guide"),
        "date": datetime.now(timezone.utc).isoformat(),
    }
    await db.segregation_history.insert_one(doc)
    doc["id"] = doc["_id"]
    return doc


@router.get("/history")
async def get_history(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    db = get_db()
    query = {"user_id": current_user["_id"]}
    skip = (page - 1) * limit
    total = await db.segregation_history.count_documents(query)
    cursor = db.segregation_history.find(query).sort("date", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = doc["_id"]
        items.append(doc)
    return {"items": items, "total": total}
