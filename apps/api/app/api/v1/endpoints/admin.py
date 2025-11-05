from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.user import User, Profile
from app.models.item import Item, ItemClaim
from app.models.event import Event
from app.models.feedback import Feedback
from app.core.security import get_current_user

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

class UserUpdate(BaseModel):
    role: str | None = None
    verified: str | None = None  # Changed to string to avoid bool parsing issues

class BlockUserRequest(BaseModel):
    blocked: bool

# User Management
@router.get("/users")
def list_users(
    role: str | None = Query(None),
    search: str | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all users with optional filters"""
    query = db.query(User).join(Profile, User.id == Profile.user_id)
    
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            Profile.name.ilike(f"%{search}%") | 
            User.email.ilike(f"%{search}%") |
            Profile.roll_no.ilike(f"%{search}%")
        )
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        result.append({
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "verified": user.verified,
            "name": profile.name if profile else None,
            "roll_no": profile.roll_no if profile else None,
            "created_at": user.created_at
        })
    
    return {
        "total": total,
        "users": result
    }

@router.get("/users/{user_id}")
def get_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get detailed user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    
    # Get user's activity stats
    items_posted = db.query(Item).filter(Item.finder_id == user_id).count()
    claims_made = db.query(ItemClaim).filter(ItemClaim.claimant_id == user_id).count()
    events_organized = db.query(Event).filter(Event.organizer_id == user_id).count()
    
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "verified": user.verified,
        "created_at": user.created_at,
        "profile": {
            "name": profile.name if profile else None,
            "roll_no": profile.roll_no if profile else None,
            "phone": profile.phone if profile else None,
            "hostel": profile.hostel if profile else None,
            "avatar_url": profile.avatar_url if profile else None
        },
        "activity": {
            "items_posted": items_posted,
            "claims_made": claims_made,
            "events_organized": events_organized
        }
    }

@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    request: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user role or verification status"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.role:
        if request.role not in ["student", "faculty", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = request.role
    
    if request.verified is not None:
        user.verified = request.verified.lower() == "true"
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "verified": user.verified
    }

# Content Moderation
@router.get("/items/flagged")
def list_flagged_items(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List items that might need moderation (e.g., very old active items)"""
    # Items active for more than 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    items = db.query(Item).filter(
        Item.status == "active",
        Item.created_at < thirty_days_ago
    ).offset(skip).limit(limit).all()
    
    result = []
    for item in items:
        finder = db.query(User).join(Profile).filter(User.id == item.finder_id).first()
        finder_profile = db.query(Profile).filter(Profile.user_id == item.finder_id).first() if item.finder_id else None
        
        result.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "status": item.status,
            "category": item.category,
            "created_at": item.created_at,
            "finder": {
                "id": str(finder.id) if finder else None,
                "name": finder_profile.name if finder_profile else None,
                "email": finder.email if finder else None
            }
        })
    
    return {"items": result}

@router.delete("/items/{item_id}")
def delete_item_admin(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete an item (admin moderation)"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Item deleted successfully"}

@router.delete("/events/{event_id}")
def delete_event_admin(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete an event (admin moderation)"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    
    return {"message": "Event deleted successfully"}

# System Statistics
@router.get("/stats/overview")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get overall system statistics"""
    total_users = db.query(User).count()
    users_by_role = db.query(
        User.role,
        func.count(User.id)
    ).group_by(User.role).all()
    
    total_items = db.query(Item).count()
    items_by_status = db.query(
        Item.status,
        func.count(Item.id)
    ).group_by(Item.status).all()
    
    total_events = db.query(Event).count()
    upcoming_events = db.query(Event).filter(
        Event.start_time > datetime.utcnow()
    ).count()
    
    total_feedback = db.query(Feedback).count()
    pending_feedback = db.query(Feedback).filter(
        Feedback.status == "pending"
    ).count()
    
    # Recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_users = db.query(User).filter(User.created_at >= seven_days_ago).count()
    new_items = db.query(Item).filter(Item.created_at >= seven_days_ago).count()
    new_events = db.query(Event).filter(Event.created_at >= seven_days_ago).count()
    
    return {
        "users": {
            "total": total_users,
            "by_role": {role: count for role, count in users_by_role},
            "new_last_7_days": new_users
        },
        "items": {
            "total": total_items,
            "by_status": {status: count for status, count in items_by_status},
            "new_last_7_days": new_items
        },
        "events": {
            "total": total_events,
            "upcoming": upcoming_events,
            "new_last_7_days": new_events
        },
        "feedback": {
            "total": total_feedback,
            "pending": pending_feedback
        }
    }

@router.get("/stats/activity")
def get_activity_timeline(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get daily activity metrics for the specified number of days"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Users created per day
    users_per_day = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(User.created_at >= start_date).group_by(func.date(User.created_at)).all()
    
    # Items created per day
    items_per_day = db.query(
        func.date(Item.created_at).label('date'),
        func.count(Item.id).label('count')
    ).filter(Item.created_at >= start_date).group_by(func.date(Item.created_at)).all()
    
    # Events created per day
    events_per_day = db.query(
        func.date(Event.created_at).label('date'),
        func.count(Event.id).label('count')
    ).filter(Event.created_at >= start_date).group_by(func.date(Event.created_at)).all()
    
    return {
        "users_per_day": [{"date": str(date), "count": count} for date, count in users_per_day],
        "items_per_day": [{"date": str(date), "count": count} for date, count in items_per_day],
        "events_per_day": [{"date": str(date), "count": count} for date, count in events_per_day]
    }

