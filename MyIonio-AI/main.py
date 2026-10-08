import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from api.controllers.schedule_controller import router as schedule_router
from api.controllers.menu_controller import router as menu_router
from pipeline.router import router as pipeline_router
from pipeline.gemini_client import is_gemini_configured
from db.pg_client import get_pool, close_pool
from utils.logger import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.

    On startup:
      - Initialises the PostgreSQL connection pool
      - Opens the PostgreSQL connection pool

    On shutdown:
      - Closes database connections cleanly
      - Closes the PostgreSQL pool
    """
    # Warm up the PG pool so the first request isn't slow
    await get_pool()


    yield  # Application runs here


    await close_pool()


app = FastAPI(title="MyIonio AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip().rstrip("/") for origin in os.getenv("AI_ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

configure_logging()

# Existing routers (menu, legacy schedule)
app.include_router(schedule_router, prefix="/schedule", tags=["Schedule (legacy)"])
app.include_router(menu_router, prefix="/menu", tags=["Menu"])

# New unified document ingestion pipeline
app.include_router(pipeline_router, prefix="/pipeline", tags=["Pipeline"])


@app.get("/admin", include_in_schema=False)
async def admin_page():
    return FileResponse("admin/index.html", media_type="text/html")



@app.get("/")
def root():
    return {
        "status": "MyIonio AI Service is running",
        "parser_configured": is_gemini_configured(),
        "admin_url": "/admin",
    }
