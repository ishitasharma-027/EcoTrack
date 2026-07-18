from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query, Response

from app.database import get_db
from app.utils.security import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/analytics")
async def analytics(admin: dict = Depends(get_admin_user)):
    db = get_db()
    total_users = await db.users.count_documents({"role": "citizen"})
    total_complaints = await db.complaints.count_documents({})
    pending = await db.complaints.count_documents({"status": "pending"})
    in_progress = await db.complaints.count_documents({"status": "in_progress"})
    resolved = await db.complaints.count_documents({"status": "resolved"})
    rejected = await db.complaints.count_documents({"status": "rejected"})
    ewaste_total = await db.ewaste_submissions.count_documents({})
    ewaste_pending = await db.ewaste_submissions.count_documents({"status": "pending"})

    # Complaint trend (last 7 days)
    trend = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        count = 0
        async for c in db.complaints.find({}):
            if c.get("date", "").startswith(day_str):
                count += 1
        trend.append({"date": day.strftime("%a"), "count": count})

    # Waste category from segregation history
    category_map: dict[str, int] = {}
    async for record in db.segregation_history.find({}):
        cat = record.get("category", "Other")
        category_map[cat] = category_map.get(cat, 0) + 1

    waste_distribution = [{"name": k, "value": v} for k, v in category_map.items()] or [
        {"name": "Plastic", "value": 12},
        {"name": "Organic", "value": 8},
        {"name": "Paper", "value": 6},
    ]

    status_distribution = [
        {"name": "Pending", "value": pending},
        {"name": "In Progress", "value": in_progress},
        {"name": "Resolved", "value": resolved},
        {"name": "Rejected", "value": rejected},
    ]

    return {
        "total_users": total_users,
        "total_complaints": total_complaints,
        "pending_complaints": pending,
        "resolved_complaints": resolved,
        "ewaste_submissions": ewaste_total,
        "ewaste_pending": ewaste_pending,
        "revenue_saved": resolved * 2500 + ewaste_total * 1200,
        "complaint_trend": trend,
        "waste_distribution": waste_distribution,
        "status_distribution": status_distribution,
    }


@router.get("/users")
async def list_users(
    admin: dict = Depends(get_admin_user),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    db = get_db()
    query: dict = {"role": "citizen"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    total = await db.users.count_documents(query)
    cursor = db.users.find(query, {"password": 0}).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        complaints = await db.complaints.count_documents({"user_id": doc["_id"]})
        ewaste = await db.ewaste_submissions.count_documents({"user_id": doc["_id"]})
        wallet = await db.eco_wallets.find_one({"user_id": doc["_id"]})
        doc["id"] = doc["_id"]
        doc["complaint_count"] = complaints
        doc["ewaste_count"] = ewaste
        doc["wallet_points"] = wallet.get("points", 0) if wallet else 0
        items.append(doc)
    return {"items": items, "total": total}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    result = await db.users.delete_one({"_id": user_id, "role": "citizen"})
    if result.deleted_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


@router.get("/export/complaints")
async def export_complaints_csv(admin: dict = Depends(get_admin_user)):
    db = get_db()
    rows = ["ID,User,Waste,Location,Status,Date"]
    async for c in db.complaints.find({}):
        loc = c.get("location", {})
        address = loc.get("address", f"{loc.get('lat','')},{loc.get('lng','')}")
        rows.append(
            f"{c['_id']},{c.get('user_name','')},{c.get('detected_waste','')},{address},{c.get('status','')},{c.get('date','')}"
        )
    content = "\n".join(rows)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=complaints.csv"},
    )
