from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import close_db, connect_db, get_db
from app.routers import admin, ai, auth, complaints, ewaste, notifications, segregation
from app.seed import seed_database
from app.services.ai_service import init_models
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def user_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    uid = current_user["_id"]
    total = await db.complaints.count_documents({"user_id": uid})
    resolved = await db.complaints.count_documents({"user_id": uid, "status": "resolved"})
    pending = await db.complaints.count_documents({"user_id": uid, "status": "pending"})
    wallet = await db.eco_wallets.find_one({"user_id": uid})
    points = wallet.get("points", 0) if wallet else 0

    recent = []
    cursor = db.complaints.find({"user_id": uid}).sort("date", -1).limit(5)
    async for doc in cursor:
        doc["id"] = doc["_id"]
        recent.append(doc)

    # Category distribution from segregation
    cat_map: dict[str, int] = {}
    async for r in db.segregation_history.find({"user_id": uid}):
        c = r.get("category", "Other")
        cat_map[c] = cat_map.get(c, 0) + 1
    waste_dist = [{"name": k, "value": v} for k, v in cat_map.items()]

    trend = []
    from datetime import datetime, timedelta, timezone

    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        count = 0
        async for c in db.complaints.find({"user_id": uid}):
            if c.get("date", "").startswith(day_str):
                count += 1
        trend.append({"date": day.strftime("%a"), "count": count})

    return {
        "complaints_total": total,
        "complaints_resolved": resolved,
        "complaints_pending": pending,
        "wallet_points": points,
        "recent_complaints": recent,
        "waste_distribution": waste_dist,
        "complaint_trend": trend,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await seed_database()
    try:
        init_models()
    except Exception as e:
        print(f"Warning: AI models failed to load: {e}")
    yield
    await close_db()


app = FastAPI(
    title="EcoTrack API",
    description="AI-Powered Smart Waste Management & E-Waste Recycling Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_path = settings.upload_path
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(complaints.router)
app.include_router(segregation.router)
app.include_router(ewaste.router)
app.include_router(admin.router)
app.include_router(notifications.router)
app.include_router(router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "EcoTrack API"}
