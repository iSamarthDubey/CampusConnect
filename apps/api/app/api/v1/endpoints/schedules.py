from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import time, datetime, timedelta
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User, Profile
from app.models.schedule import Schedule

router = APIRouter()

class CreateScheduleRequest(BaseModel):
    day_of_week: int  # 0=Sun, 6=Sat
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    title: str
    venue: Optional[str] = None

class UpdateScheduleRequest(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    title: Optional[str] = None
    venue: Optional[str] = None

class ScheduleResponse(BaseModel):
    id: int
    day_of_week: int
    start_time: str
    end_time: str
    title: str
    venue: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class FreeSlotsRequest(BaseModel):
    user_ids: List[str]  # UUIDs as strings
    day_of_week: Optional[int] = None  # If specified, only search this day

class FreeSlot(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str

def time_to_str(t: time) -> str:
    return t.strftime("%H:%M")

def str_to_time(s: str) -> time:
    h, m = map(int, s.split(":"))
    return time(hour=h, minute=m)

@router.get("/me", response_model=List[ScheduleResponse])
def get_my_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedules = db.query(Schedule).filter(
        Schedule.user_id == current_user.id
    ).order_by(Schedule.day_of_week, Schedule.start_time).all()
    
    return [
        ScheduleResponse(
            id=s.id,
            day_of_week=s.day_of_week,
            start_time=time_to_str(s.start_time),
            end_time=time_to_str(s.end_time),
            title=s.title,
            venue=s.venue,
            created_at=s.created_at
        )
        for s in schedules
    ]

@router.post("/", response_model=ScheduleResponse)
@router.post("", response_model=ScheduleResponse)
async def create_schedule(
    request: CreateScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate day_of_week
    if not 0 <= request.day_of_week <= 6:
        raise HTTPException(status_code=400, detail="day_of_week must be between 0 (Sunday) and 6 (Saturday)")
    
    # Validate times
    try:
        start = str_to_time(request.start_time)
        end = str_to_time(request.end_time)
    except:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
    
    if start >= end:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")
    
    schedule = Schedule(
        user_id=current_user.id,
        day_of_week=request.day_of_week,
        start_time=start,
        end_time=end,
        title=request.title,
        venue=request.venue
    )
    
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    return ScheduleResponse(
        id=schedule.id,
        day_of_week=schedule.day_of_week,
        start_time=time_to_str(schedule.start_time),
        end_time=time_to_str(schedule.end_time),
        title=schedule.title,
        venue=schedule.venue,
        created_at=schedule.created_at
    )

@router.patch("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    request: UpdateScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if request.day_of_week is not None:
        if not 0 <= request.day_of_week <= 6:
            raise HTTPException(status_code=400, detail="day_of_week must be between 0 and 6")
        schedule.day_of_week = request.day_of_week
    
    if request.start_time is not None:
        try:
            schedule.start_time = str_to_time(request.start_time)
        except:
            raise HTTPException(status_code=400, detail="Invalid start_time format")
    
    if request.end_time is not None:
        try:
            schedule.end_time = str_to_time(request.end_time)
        except:
            raise HTTPException(status_code=400, detail="Invalid end_time format")
    
    if schedule.start_time >= schedule.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")
    
    if request.title is not None:
        schedule.title = request.title
    
    if request.venue is not None:
        schedule.venue = request.venue
    
    db.commit()
    db.refresh(schedule)
    
    return ScheduleResponse(
        id=schedule.id,
        day_of_week=schedule.day_of_week,
        start_time=time_to_str(schedule.start_time),
        end_time=time_to_str(schedule.end_time),
        title=schedule.title,
        venue=schedule.venue,
        created_at=schedule.created_at
    )

@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "Schedule deleted successfully"}

@router.post("/free-slots", response_model=List[FreeSlot])
async def find_free_slots(
    request: FreeSlotsRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Include current user in the search
    all_user_ids = list(set([str(current_user.id)] + request.user_ids))
    
    # Convert string UUIDs to UUID objects
    try:
        from uuid import UUID
        user_uuids = [UUID(uid) for uid in all_user_ids]
    except:
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    # Determine which days to check
    days_to_check = [request.day_of_week] if request.day_of_week is not None else list(range(7))
    
    free_slots = []
    
    for day in days_to_check:
        # Get all schedules for all users on this day
        schedules = db.query(Schedule).filter(
            Schedule.user_id.in_(user_uuids),
            Schedule.day_of_week == day
        ).order_by(Schedule.start_time).all()
        
        # Group by user to find overlapping busy times
        busy_times = []
        for schedule in schedules:
            busy_times.append((schedule.start_time, schedule.end_time))
        
        # Merge overlapping intervals
        if busy_times:
            busy_times.sort()
            merged = [busy_times[0]]
            for start, end in busy_times[1:]:
                if start <= merged[-1][1]:
                    merged[-1] = (merged[-1][0], max(merged[-1][1], end))
                else:
                    merged.append((start, end))
            busy_times = merged
        
        # Find free slots (assuming 8 AM to 10 PM working hours)
        day_start = time(8, 0)
        day_end = time(22, 0)
        
        if not busy_times:
            # Entire day is free
            free_slots.append(FreeSlot(
                day_of_week=day,
                start_time=time_to_str(day_start),
                end_time=time_to_str(day_end)
            ))
        else:
            # Check before first busy slot
            if day_start < busy_times[0][0]:
                free_slots.append(FreeSlot(
                    day_of_week=day,
                    start_time=time_to_str(day_start),
                    end_time=time_to_str(busy_times[0][0])
                ))
            
            # Check between busy slots
            for i in range(len(busy_times) - 1):
                gap_start = busy_times[i][1]
                gap_end = busy_times[i + 1][0]
                if gap_start < gap_end:
                    free_slots.append(FreeSlot(
                        day_of_week=day,
                        start_time=time_to_str(gap_start),
                        end_time=time_to_str(gap_end)
                    ))
            
            # Check after last busy slot
            if busy_times[-1][1] < day_end:
                free_slots.append(FreeSlot(
                    day_of_week=day,
                    start_time=time_to_str(busy_times[-1][1]),
                    end_time=time_to_str(day_end)
                ))
    
    return free_slots

