from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.exception_handlers import http_exception_handler, request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import close_db, connect_db, get_db
from app.routers import admin, ai, auth, complaints, ewaste, notifications, segregation
from app.seed import seed_database
from app.services.ai_service import init_models, models_ready
from app.services.model_integrity import verified_hashes
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
    try:
        await seed_database()
    except Exception as e:
        print(f"Database seed notice: {e}")
        if settings.environment.lower() == "production":
            raise
    try:
        init_models()
    except Exception as e:
        print("AI models failed to load.")
        if settings.environment.lower() == "production":
            raise
        print(f"Warning: continuing without models in {settings.environment}: {type(e).__name__}")
    yield
    await close_db()


_docs = "/docs" if settings.docs_enabled else None
_redoc = "/redoc" if settings.docs_enabled else None

app = FastAPI(
    title="EcoTrack API",
    description="AI-Powered Smart Waste Management & E-Waste Recycling Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=_docs,
    redoc_url=_redoc,
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

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
    hashes = verified_hashes()
    return {
        "status": "ok",
        "service": "EcoTrack API",
        "models_loaded": models_ready(),
        "model_hashes_verified": bool(hashes),
    }
