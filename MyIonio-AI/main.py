import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.controllers.schedule_controller import router as schedule_router
from api.controllers.menu_controller import router as menu_router
from kafka.consumer import run_consumer
from kafka.notes_consumer import run_notes_consumer
from utils.logger import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Starts the Kafka consumer as a background asyncio task on startup
    and cancels it gracefully on shutdown.

    Interview note: this is the modern replacement for @app.on_event('startup').
    The consumer runs concurrently with request handling without blocking the
    event loop, because poll() is offloaded to a thread-pool executor.
    """
    kafka_task = asyncio.create_task(run_consumer())
    notes_task = asyncio.create_task(run_notes_consumer())
    yield  # Application runs here
    kafka_task.cancel()
    notes_task.cancel()
    try:
        await asyncio.gather(kafka_task, notes_task)
    except asyncio.CancelledError:
        pass


app = FastAPI(title="MyIonio AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

configure_logging()

app.include_router(schedule_router, prefix="/schedule", tags=["Schedule"])
app.include_router(menu_router, prefix="/menu", tags=["Menu"])

@app.get("/")
def root():
    return {"status": "MyIonio API is running"}

