from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class Location(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None


class ComplaintCreate(BaseModel):
    image: str
    detected_waste: str
    confidence: float
    location: Location
    description: Optional[str] = None
    detections: list = []


class ComplaintUpdate(BaseModel):
    status: Optional[Literal["pending", "in_progress", "resolved", "rejected"]] = None
    assigned_worker: Optional[str] = None
    municipality: Optional[str] = None


class EWasteCreate(BaseModel):
    image: str
    waste_type: str
    center_id: str


class EWasteVerify(BaseModel):
    status: Literal["approved", "rejected"]
    points: Optional[int] = None


class RewardRedeem(BaseModel):
    reward_id: str


class CollectionCenterCreate(BaseModel):
    name: str
    address: str
    phone: str
    map_link: str
    opening_time: str
    area: str
