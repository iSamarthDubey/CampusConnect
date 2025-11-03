from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/me")
def get_my_schedule():
    # TODO: get current user's timetable
    raise HTTPException(status_code=501, detail="Not implemented")

@router.post("/upload")
def upload_schedule():
    # TODO: upload ICS/CSV and parse timetable
    raise HTTPException(status_code=501, detail="Not implemented")

@router.post("/free-slots")
def find_free_slots():
    # TODO: find common free slots with friends
    raise HTTPException(status_code=501, detail="Not implemented")

