"""
TalentMatch AI - FastAPI Main Application Entry Point
Configures middleware, CORS, routers, and startup events
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import time
import os

from app.config import settings
from app.database import create_tables
from app.routers import auth, jd, resumes, analysis, analytics, export

# ─────────────────────────────────────────
# Logging Configuration
# ─────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────
# Lifespan Events
# ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 TalentMatch AI starting up...")
    create_tables()
    logger.info("✅ Database tables initialized")
    yield
    logger.info("🛑 TalentMatch AI shutting down...")


# ─────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────
app = FastAPI(
    title="TalentMatch AI API",
    description="""
    **TalentMatch AI** – Resume Screening & Candidate Ranking Platform

    Upload resumes and job descriptions, run AI-powered matching,
    get ranked candidates with detailed scoring insights.

    ## Features
    - 🔐 JWT Authentication
    - 📄 Multi-format resume parsing (PDF, DOC, DOCX)
    - 🤖 AI semantic matching with sentence-transformers
    - 📊 Detailed scoring breakdown
    - 📈 Analytics dashboard
    - 📥 CSV/Excel export
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ─────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again."}
    )


# ─────────────────────────────────────────
# Static Files (for serving uploaded files)
# ─────────────────────────────────────────
uploads_dir = settings.UPLOAD_DIR
os.makedirs(uploads_dir, exist_ok=True)


# ─────────────────────────────────────────
# API Routers
# ─────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(jd.router, prefix=API_PREFIX)
app.include_router(resumes.router, prefix=API_PREFIX)
app.include_router(analysis.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(export.router, prefix=API_PREFIX)


# ─────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for deployment monitoring."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"])
def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
