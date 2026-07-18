import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.database import get_db
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.notifications.find({"user_id": current_user["_id"]}).sort("date", -1).limit(50)
    items = []
    async for doc in cursor:
        doc["id"] = doc["_id"]
        items.append(doc)
    unread = sum(1 for n in items if not n.get("read"))
    return {"items": items, "unread_count": unread}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await get_db().notifications.update_one(
        {"_id": notification_id, "user_id": current_user["_id"]},
        {"$set": {"read": True}},
    )
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await get_db().notifications.update_many(
        {"user_id": current_user["_id"]},
        {"$set": {"read": True}},
    )
    return {"message": "All marked as read"}
