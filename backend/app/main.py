"""
Agentic PR Manager — FastAPI Application Entry Point

ॐ श्री गणेशाय नमः
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.schemas import HealthResponse

settings = get_settings()


# ═══════════════════════════════════════════════════════════
# Lifespan: startup & shutdown hooks
# ═══════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables on startup, dispose engine on shutdown."""
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database tables created / verified.")

    yield

    # Shutdown
    await engine.dispose()
    print("[INFO] Database engine disposed.")


# ═══════════════════════════════════════════════════════════
# FastAPI App
# ═══════════════════════════════════════════════════════════

app = FastAPI(
    title=settings.app_name,
    description=(
        "Autonomous agentic pipeline for culturally-accurate, personalized greeting card "
        "generation and single-tap social dispatch."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files (Greeting Card Assets) ───────────────────
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ═══════════════════════════════════════════════════════════
# Root & Health Endpoints
# ═══════════════════════════════════════════════════════════

@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.app_name,
        "message": "ॐ श्री गणेशाय नमः — Agentic PR Manager is running.",
        "docs": "/docs",
    }


@app.get(f"{settings.api_v1_prefix}/system/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Service heartbeat endpoint."""
    db_status = "unknown"
    try:
        async with engine.begin() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"

    return HealthResponse(
        status="healthy",
        app_name=settings.app_name,
        version="0.1.0",
        environment=settings.app_env,
        database=db_status,
        timestamp=datetime.now(timezone.utc),
    )


# ═══════════════════════════════════════════════════════════
# Register Routers
# ═══════════════════════════════════════════════════════════

from app.routers import auth, users, calendar, artifacts, devices  # noqa: E402

app.include_router(auth.router, prefix=settings.api_v1_prefix, tags=["Authentication"])
app.include_router(users.router, prefix=settings.api_v1_prefix, tags=["Users"])
app.include_router(calendar.router, prefix=settings.api_v1_prefix, tags=["Calendar"])
app.include_router(artifacts.router, prefix=settings.api_v1_prefix, tags=["Artifacts"])
app.include_router(devices.router, prefix=settings.api_v1_prefix, tags=["Devices"])
