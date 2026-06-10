import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.controllers.schedule_controller import router as schedule_router
from api.controllers.menu_controller import router as menu_router
from pipeline.router import router as pipeline_router
from kafka.consumer import run_consumer
from kafka.notes_consumer import run_notes_consumer
from db.pg_client import get_pool, close_pool
from utils.logger import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.

    On startup:
      - Initialises the PostgreSQL connection pool
      - Starts Kafka consumers as background asyncio tasks

    On shutdown:
      - Cancels Kafka consumer tasks
      - Closes the PostgreSQL pool
    """
    # Warm up the PG pool so the first request isn't slow
    await get_pool()

    kafka_task = asyncio.create_task(run_consumer())
    notes_task = asyncio.create_task(run_notes_consumer())

    yield  # Application runs here

    kafka_task.cancel()
    notes_task.cancel()
    try:
        await asyncio.gather(kafka_task, notes_task)
    except asyncio.CancelledError:
        pass

    await close_pool()


app = FastAPI(title="MyIonio AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.get("/")
def root():
    return {"status": "MyIonio AI Service is running"}
