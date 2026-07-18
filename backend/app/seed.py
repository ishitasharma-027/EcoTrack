import uuid
from datetime import datetime, timezone

from app.config import settings
from app.database import get_db
from app.utils.security import hash_password


async def seed_database() -> None:
    db = get_db()

    # Admin user
    admin = await db.users.find_one({"email": settings.admin_email.lower()})
    if not admin:
        admin_id = str(uuid.uuid4())
        await db.users.insert_one(
            {
                "_id": admin_id,
                "name": "EcoTrack Admin",
                "email": settings.admin_email.lower(),
                "phone": "+91 9876543210",
                "password": hash_password(settings.admin_password),
                "role": "admin",
                "avatar": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    # Collection centers
    if await db.collection_centers.count_documents({}) == 0:
        centers = [
            {
                "name": "Indore Smart City Center",
                "area": "Vijay Nagar",
                "address": "Scheme 54, Vijay Nagar, Indore, MP 452010",
                "phone": "+91 731 4285600",
                "map_link": "https://maps.google.com/?q=Vijay+Nagar+Indore",
                "opening_time": "9:00 AM - 6:00 PM",
            },
            {
                "name": "Rajendra Nagar E-Waste Hub",
                "area": "Rajendra Nagar",
                "address": "Rajendra Nagar Main Road, Indore, MP 452012",
                "phone": "+91 731 2567890",
                "map_link": "https://maps.google.com/?q=Rajendra+Nagar+Indore",
                "opening_time": "10:00 AM - 7:00 PM",
            },
            {
                "name": "Bhawarkuan Recycling Point",
                "area": "Bhawarkuan",
                "address": "AB Road, Bhawarkuan Square, Indore, MP 452001",
                "phone": "+91 731 9876543",
                "map_link": "https://maps.google.com/?q=Bhawarkuan+Indore",
                "opening_time": "8:00 AM - 8:00 PM",
            },
            {
                "name": "Palasia Green Center",
                "area": "Palasia",
                "address": "MG Road, Palasia, Indore, MP 452001",
                "phone": "+91 731 2345678",
                "map_link": "https://maps.google.com/?q=Palasia+Indore",
                "opening_time": "9:00 AM - 6:00 PM",
            },
            {
                "name": "Bengali Square Collection Hub",
                "area": "Bengali Square",
                "address": "Bengali Square, Indore, MP 452018",
                "phone": "+91 731 8765432",
                "map_link": "https://maps.google.com/?q=Bengali+Square+Indore",
                "opening_time": "10:00 AM - 5:00 PM",
            },
        ]
        for c in centers:
            c["_id"] = str(uuid.uuid4())
            await db.collection_centers.insert_one(c)

    # Rewards
    if await db.rewards.count_documents({}) == 0:
        rewards = [
            {"name": "Amazon Voucher", "points_cost": 500, "icon": "amazon", "description": "₹100 Amazon gift card"},
            {"name": "Flipkart Voucher", "points_cost": 500, "icon": "flipkart", "description": "₹100 Flipkart gift card"},
            {"name": "Movie Ticket", "points_cost": 300, "icon": "movie", "description": "1 PVR movie ticket"},
            {"name": "Metro Card Recharge", "points_cost": 400, "icon": "metro", "description": "₹50 metro recharge"},
            {"name": "Plant Sapling", "points_cost": 150, "icon": "plant", "description": "Free plant sapling"},
            {"name": "Coffee Coupon", "points_cost": 200, "icon": "coffee", "description": "Cafe Coffee Day coupon"},
            {"name": "Donation", "points_cost": 100, "icon": "donation", "description": "Donate to green NGO"},
        ]
        for r in rewards:
            r["_id"] = str(uuid.uuid4())
            await db.rewards.insert_one(r)

    # Sample demo citizen
    demo = await db.users.find_one({"email": "demo@ecotrack.com"})
    if not demo:
        demo_id = str(uuid.uuid4())
        await db.users.insert_one(
            {
                "_id": demo_id,
                "name": "Demo Citizen",
                "email": "demo@ecotrack.com",
                "phone": "+91 9123456789",
                "password": hash_password("Demo@123"),
                "role": "citizen",
                "avatar": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        await db.eco_wallets.insert_one(
            {
                "_id": demo_id,
                "user_id": demo_id,
                "points": 350,
                "transactions": [
                    {
                        "type": "credit",
                        "amount": 350,
                        "description": "Welcome + sample activity",
                        "date": datetime.now(timezone.utc).isoformat(),
                    }
                ],
            }
        )
