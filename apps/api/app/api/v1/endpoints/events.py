from fastapi import APIRouter, HTTPException, Depends, Query, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User, Profile
from app.models.event import Event, rsvps
from icalendar import Calendar, Event as ICalEvent

router = APIRouter()

class CreateEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    venue: Optional[str] = None
    tags: Optional[List[str]] = None
    max_attendees: Optional[int] = None

class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    venue: Optional[str] = None
    tags: Optional[List[str]] = None
    max_attendees: Optional[int] = None

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    venue: Optional[str]
    organizer_id: Optional[str]
    organizer_name: Optional[str]
    tags: Optional[List[str]]
    max_attendees: Optional[int]
    attendee_count: int
    is_rsvped: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[EventResponse])
@router.get("", response_model=List[EventResponse])
def list_events(
    upcoming: Optional[bool] = Query(None),
    q: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    
    # Filter upcoming events
    if upcoming:
        query = query.filter(Event.start_time >= datetime.utcnow())
    
    # Search by title/description
    if q:
        query = query.filter(
            (Event.title.ilike(f"%{q}%")) | (Event.description.ilike(f"%{q}%"))
        )
    
    # Filter by tag
    if tag:
        query = query.filter(Event.tags.contains([tag]))
    
    events = query.order_by(Event.start_time.asc()).offset(offset).limit(limit).all()
    
    # Get organizer names
    organizer_ids = [e.organizer_id for e in events if e.organizer_id]
    name_map = {}
    if organizer_ids:
        profiles = db.query(Profile).filter(Profile.user_id.in_(organizer_ids)).all()
        name_map = {p.user_id: p.name for p in profiles}
    
    # Check RSVPs for current user
    user_rsvps = set()
    if current_user:
        user_rsvp_query = db.query(rsvps).filter(rsvps.c.user_id == current_user.id).all()
        user_rsvps = {r.event_id for r in user_rsvp_query}
    
    return [
        EventResponse(
            id=e.id,
            title=e.title,
            description=e.description,
            start_time=e.start_time,
            end_time=e.end_time,
            venue=e.venue,
            organizer_id=str(e.organizer_id) if e.organizer_id else None,
            organizer_name=name_map.get(e.organizer_id),
            tags=e.tags,
            max_attendees=e.max_attendees,
            attendee_count=len(e.attendees),
            is_rsvped=e.id in user_rsvps,
            created_at=e.created_at
        )
        for e in events
    ]

@router.post("/", response_model=EventResponse)
@router.post("", response_model=EventResponse)
async def create_event(
    request: CreateEventRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only faculty and admin can create events
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can create events")
    
    event = Event(
        title=request.title,
        description=request.description,
        start_time=request.start_time,
        end_time=request.end_time,
        venue=request.venue,
        organizer_id=current_user.id,
        tags=request.tags,
        max_attendees=request.max_attendees
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Get organizer name
    organizer_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        venue=event.venue,
        organizer_id=str(event.organizer_id),
        organizer_name=organizer_profile.name if organizer_profile else None,
        tags=event.tags,
        max_attendees=event.max_attendees,
        attendee_count=0,
        is_rsvped=False,
        created_at=event.created_at
    )

@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get organizer name
    organizer_profile = db.query(Profile).filter(Profile.user_id == event.organizer_id).first() if event.organizer_id else None
    
    # Check if current user has RSVPed
    is_rsvped = False
    if current_user:
        rsvp_exists = db.query(rsvps).filter(
            rsvps.c.user_id == current_user.id,
            rsvps.c.event_id == event_id
        ).first()
        is_rsvped = rsvp_exists is not None
    
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        venue=event.venue,
        organizer_id=str(event.organizer_id) if event.organizer_id else None,
        organizer_name=organizer_profile.name if organizer_profile else None,
        tags=event.tags,
        max_attendees=event.max_attendees,
        attendee_count=len(event.attendees),
        is_rsvped=is_rsvped,
        created_at=event.created_at
    )

@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    request: UpdateEventRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Only organizer or admin can update
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if request.title is not None:
        event.title = request.title
    if request.description is not None:
        event.description = request.description
    if request.start_time is not None:
        event.start_time = request.start_time
    if request.end_time is not None:
        event.end_time = request.end_time
    if request.venue is not None:
        event.venue = request.venue
    if request.tags is not None:
        event.tags = request.tags
    if request.max_attendees is not None:
        event.max_attendees = request.max_attendees
    
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)
    
    organizer_profile = db.query(Profile).filter(Profile.user_id == event.organizer_id).first()
    is_rsvped = db.query(rsvps).filter(
        rsvps.c.user_id == current_user.id,
        rsvps.c.event_id == event_id
    ).first() is not None
    
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        venue=event.venue,
        organizer_id=str(event.organizer_id),
        organizer_name=organizer_profile.name if organizer_profile else None,
        tags=event.tags,
        max_attendees=event.max_attendees,
        attendee_count=len(event.attendees),
        is_rsvped=is_rsvped,
        created_at=event.created_at
    )

@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Only organizer or admin can delete
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(event)
    db.commit()
    
    return {"message": "Event deleted successfully"}

@router.post("/{event_id}/rsvp")
async def rsvp_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already RSVPed
    existing_rsvp = db.query(rsvps).filter(
        rsvps.c.user_id == current_user.id,
        rsvps.c.event_id == event_id
    ).first()
    
    if existing_rsvp:
        raise HTTPException(status_code=400, detail="Already RSVPed to this event")
    
    # Check max attendees
    if event.max_attendees and len(event.attendees) >= event.max_attendees:
        raise HTTPException(status_code=400, detail="Event is full")
    
    # Add RSVP
    db.execute(rsvps.insert().values(user_id=current_user.id, event_id=event_id))
    db.commit()
    
    return {"message": "RSVP successful", "attendee_count": len(event.attendees) + 1}

@router.delete("/{event_id}/rsvp")
async def cancel_rsvp(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if RSVPed
    existing_rsvp = db.query(rsvps).filter(
        rsvps.c.user_id == current_user.id,
        rsvps.c.event_id == event_id
    ).first()
    
    if not existing_rsvp:
        raise HTTPException(status_code=400, detail="Not RSVPed to this event")
    
    # Remove RSVP
    db.execute(rsvps.delete().where(
        rsvps.c.user_id == current_user.id,
        rsvps.c.event_id == event_id
    ))
    db.commit()
    
    return {"message": "RSVP cancelled"}

@router.get("/{event_id}/ics")
def export_ics(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Create iCalendar object
    cal = Calendar()
    cal.add('prodid', '-//CampusConnect//Event//EN')
    cal.add('version', '2.0')
    
    # Create event
    ical_event = ICalEvent()
    ical_event.add('summary', event.title)
    if event.description:
        ical_event.add('description', event.description)
    ical_event.add('dtstart', event.start_time)
    if event.end_time:
        ical_event.add('dtend', event.end_time)
    if event.venue:
        ical_event.add('location', event.venue)
    ical_event.add('dtstamp', datetime.utcnow())
    ical_event.add('uid', f'event-{event.id}@campusconnect.com')
    
    cal.add_component(ical_event)
    
    # Return as downloadable file
    return Response(
        content=cal.to_ical(),
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename=event-{event.id}.ics"
        }
    )

