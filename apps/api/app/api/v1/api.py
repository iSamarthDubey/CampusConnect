from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, items, events, schedules, feedback, upload

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(items.router, prefix="/items", tags=["lost-and-found"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])

