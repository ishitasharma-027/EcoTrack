import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.schemas.schemas import ComplaintCreate, ComplaintUpdate
from app.utils.security import get_admin_user, get_current_user

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


@router.post("")
async def create_complaint(data: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    complaint_id = str(uuid.uuid4())
    doc = {
        "_id": complaint_id,
        "user_id": current_user["_id"],
        "user_name": current_user["name"],
        "image": data.image,
        "detected_waste": data.detected_waste,
        "confidence": data.confidence,
        "location": data.location.model_dump(),
        "description": data.description,
        "detections": data.detections,
        "status": "pending",
        "assigned_worker": None,
        "municipality": None,
        "date": datetime.now(timezone.utc).isoformat(),
    }
    await db.complaints.insert_one(doc)

    await db.notifications.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "title": "Complaint Submitted",
            "message": f"Your complaint #{complaint_id[:8]} has been submitted successfully.",
            "type": "complaint",
            "read": False,
            "date": datetime.now(timezone.utc).isoformat(),
        }
    )

    doc["id"] = doc["_id"]
    return doc


@router.get("")
async def list_complaints(
    current_user: dict = Depends(get_current_user),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    db = get_db()
    query: dict = {}
    if current_user["role"] != "admin":
        query["user_id"] = current_user["_id"]
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await db.complaints.count_documents(query)
    cursor = db.complaints.find(query).sort("date", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = doc["_id"]
        items.append(doc)
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get("/{complaint_id}")
async def get_complaint(complaint_id: str, current_user: dict = Depends(get_current_user)):
    doc = await get_db().complaints.find_one({"_id": complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user["role"] != "admin" and doc["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    doc["id"] = doc["_id"]
    return doc


@router.patch("/{complaint_id}")
async def update_complaint(
    complaint_id: str,
    data: ComplaintUpdate,
    admin: dict = Depends(get_admin_user),
):
    db = get_db()
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")

    from pymongo import ReturnDocument

    result = await db.complaints.find_one_and_update(
        {"_id": complaint_id},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Complaint not found")

    await db.notifications.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "user_id": result["user_id"],
            "title": "Complaint Updated",
            "message": f"Your complaint status is now: {update.get('status', 'updated')}.",
            "type": "complaint",
            "read": False,
            "date": datetime.now(timezone.utc).isoformat(),
        }
    )

    result["id"] = result["_id"]
    return result
