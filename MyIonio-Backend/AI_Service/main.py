from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.controllers.schedule_controller import router as schedule_router
from api.controllers.menu_controller import router as menu_router

from utils.logger import configure_logging

app = FastAPI(title="IonioPortal API")

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
    return {"status": "IonioPortal API is running"}
