import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.schemas.schemas import PasswordChange, TokenResponse, UserLogin, UserRegister, UserUpdate
from app.utils.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _serialize_user(user: dict) -> dict:
    return {
        "id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user["role"],
        "avatar": user.get("avatar"),
        "created_at": user.get("created_at"),
    }


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
    db = get_db()
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user = {
        "_id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "phone": data.phone,
        "password": hash_password(data.password),
        "role": "citizen",
        "avatar": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)

    # Initialize wallet
    await db.eco_wallets.insert_one(
        {
            "_id": user_id,
            "user_id": user_id,
            "points": 50,
            "transactions": [
                {
                    "type": "credit",
                    "amount": 50,
                    "description": "Welcome bonus",
                    "date": datetime.now(timezone.utc).isoformat(),
                }
            ],
        }
    )

    token = create_access_token({"sub": user_id, "role": "citizen"})
    return TokenResponse(access_token=token, user=_serialize_user(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["_id"], "role": user["role"]})
    return TokenResponse(access_token=token, user=_serialize_user(user))


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return _serialize_user(current_user)


@router.put("/profile")
async def update_profile(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update})
    user = await db.users.find_one({"_id": current_user["_id"]})
    return _serialize_user(user)


@router.post("/change-password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await get_db().users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": hash_password(data.new_password)}},
    )
    return {"message": "Password updated successfully"}
