import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.schemas.schemas import CollectionCenterCreate, EWasteCreate, EWasteVerify, RewardRedeem
from app.utils.security import get_admin_user, get_current_user

router = APIRouter(prefix="/api", tags=["E-Waste & Wallet"])


@router.get("/centers")
async def list_centers():
    db = get_db()
    items = []
    async for doc in db.collection_centers.find():
        doc["id"] = doc["_id"]
        items.append(doc)
    return items


@router.post("/centers")
async def create_center(data: CollectionCenterCreate, admin: dict = Depends(get_admin_user)):
    center_id = str(uuid.uuid4())
    doc = {"_id": center_id, **data.model_dump()}
    await get_db().collection_centers.insert_one(doc)
    doc["id"] = center_id
    return doc


@router.post("/ewaste")
async def submit_ewaste(data: EWasteCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    center = await db.collection_centers.find_one({"_id": data.center_id})
    if not center:
        raise HTTPException(status_code=404, detail="Collection center not found")

    submission_id = str(uuid.uuid4())
    doc = {
        "_id": submission_id,
        "user_id": current_user["_id"],
        "user_name": current_user["name"],
        "image": data.image,
        "waste_type": data.waste_type,
        "center_id": data.center_id,
        "center_name": center["name"],
        "status": "pending",
        "points": 0,
        "verification_date": None,
        "date": datetime.now(timezone.utc).isoformat(),
    }
    await db.ewaste_submissions.insert_one(doc)

    await db.notifications.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "title": "E-Waste Submitted",
            "message": f"Your e-waste submission to {center['name']} is pending verification.",
            "type": "ewaste",
            "read": False,
            "date": datetime.now(timezone.utc).isoformat(),
        }
    )

    doc["id"] = submission_id
    return doc


@router.get("/ewaste")
async def list_ewaste(
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
    total = await db.ewaste_submissions.count_documents(query)
    cursor = db.ewaste_submissions.find(query).sort("date", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = doc["_id"]
        items.append(doc)
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.patch("/ewaste/{submission_id}/verify")
async def verify_ewaste(
    submission_id: str,
    data: EWasteVerify,
    admin: dict = Depends(get_admin_user),
):
    db = get_db()
    submission = await db.ewaste_submissions.find_one({"_id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    points = data.points if data.points is not None else (100 if data.status == "approved" else 0)
    update = {
        "status": data.status,
        "points": points,
        "verification_date": datetime.now(timezone.utc).isoformat(),
    }
    await db.ewaste_submissions.update_one({"_id": submission_id}, {"$set": update})

    if data.status == "approved" and points > 0:
        await db.eco_wallets.update_one(
            {"user_id": submission["user_id"]},
            {
                "$inc": {"points": points},
                "$push": {
                    "transactions": {
                        "type": "credit",
                        "amount": points,
                        "description": f"E-Waste verification: {submission['waste_type']}",
                        "date": datetime.now(timezone.utc).isoformat(),
                    }
                },
            },
        )
        await db.notifications.insert_one(
            {
                "_id": str(uuid.uuid4()),
                "user_id": submission["user_id"],
                "title": "E-Waste Approved",
                "message": f"You earned {points} eco points!",
                "type": "reward",
                "read": False,
                "date": datetime.now(timezone.utc).isoformat(),
            }
        )

    updated = await db.ewaste_submissions.find_one({"_id": submission_id})
    updated["id"] = updated["_id"]
    return updated


@router.get("/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    wallet = await get_db().eco_wallets.find_one({"user_id": current_user["_id"]})
    if not wallet:
        return {"points": 0, "transactions": []}
    wallet["id"] = wallet["_id"]
    return wallet


@router.get("/rewards")
async def list_rewards():
    db = get_db()
    items = []
    async for doc in db.rewards.find():
        doc["id"] = doc["_id"]
        items.append(doc)
    return items


@router.post("/rewards/redeem")
async def redeem_reward(data: RewardRedeem, current_user: dict = Depends(get_current_user)):
    db = get_db()
    reward = await db.rewards.find_one({"_id": data.reward_id})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    wallet = await db.eco_wallets.find_one({"user_id": current_user["_id"]})
    if not wallet or wallet.get("points", 0) < reward["points_cost"]:
        raise HTTPException(status_code=400, detail="Insufficient points")

    await db.eco_wallets.update_one(
        {"user_id": current_user["_id"]},
        {
            "$inc": {"points": -reward["points_cost"]},
            "$push": {
                "transactions": {
                    "type": "debit",
                    "amount": reward["points_cost"],
                    "description": f"Redeemed: {reward['name']}",
                    "date": datetime.now(timezone.utc).isoformat(),
                }
            },
        },
    )

    await db.notifications.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "title": "Reward Redeemed",
            "message": f"You redeemed {reward['name']}!",
            "type": "reward",
            "read": False,
            "date": datetime.now(timezone.utc).isoformat(),
        }
    )

    return {"message": "Reward redeemed successfully", "reward": reward["name"]}
