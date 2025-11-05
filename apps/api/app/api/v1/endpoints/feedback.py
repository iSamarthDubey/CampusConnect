from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.db.session import get_db
from app.models.feedback import Feedback, FeedbackToken
from app.models.user import User
from app.core.security import get_current_user
import secrets
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class FeedbackSubmit(BaseModel):
    token: str
    category: str  # academics, facilities, food, hostel, other
    subject: str
    message: str

class FeedbackUpdate(BaseModel):
    status: str  # pending, reviewed, resolved
    admin_notes: str | None = None

class TokenGenerate(BaseModel):
    count: int = 10

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.post("/submit")
def submit_feedback(request: FeedbackSubmit, db: Session = Depends(get_db)):
    """Submit anonymous feedback using a valid token"""
    # Validate token
    token_obj = db.query(FeedbackToken).filter(
        FeedbackToken.token == request.token,
        FeedbackToken.used == False
    ).first()
    
    if not token_obj:
        raise HTTPException(status_code=400, detail="Invalid or already used token")
    
    # Validate category
    valid_categories = ["academics", "facilities", "food", "hostel", "other"]
    if request.category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}")
    
    # Create feedback
    feedback = Feedback(
        category=request.category,
        subject=request.subject,
        message=request.message,
        token=request.token,
        status="pending"
    )
    db.add(feedback)
    
    # Mark token as used
    token_obj.used = True
    token_obj.used_at = datetime.utcnow()
    
    db.commit()
    db.refresh(feedback)
    
    return {
        "id": feedback.id,
        "message": "Feedback submitted successfully",
        "created_at": feedback.created_at
    }

@router.get("/admin/list")
def list_feedback_admin(
    status: str | None = Query(None),
    category: str | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin endpoint to list all feedback with optional filters"""
    query = db.query(Feedback)
    
    if status:
        query = query.filter(Feedback.status == status)
    if category:
        query = query.filter(Feedback.category == category)
    
    total = query.count()
    feedbacks = query.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            {
                "id": f.id,
                "category": f.category,
                "subject": f.subject,
                "message": f.message,
                "status": f.status,
                "admin_notes": f.admin_notes,
                "created_at": f.created_at,
                "resolved_at": f.resolved_at
            }
            for f in feedbacks
        ]
    }

@router.get("/admin/stats")
def get_feedback_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get feedback statistics"""
    total = db.query(Feedback).count()
    by_status = db.query(
        Feedback.status,
        func.count(Feedback.id)
    ).group_by(Feedback.status).all()
    
    by_category = db.query(
        Feedback.category,
        func.count(Feedback.id)
    ).group_by(Feedback.category).all()
    
    return {
        "total": total,
        "by_status": {status: count for status, count in by_status},
        "by_category": {cat: count for cat, count in by_category}
    }

@router.patch("/admin/{feedback_id}")
def update_feedback(
    feedback_id: int,
    request: FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update feedback status and add admin notes"""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    feedback.status = request.status
    if request.admin_notes:
        feedback.admin_notes = request.admin_notes
    if request.status == "resolved":
        feedback.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(feedback)
    
    return {
        "id": feedback.id,
        "status": feedback.status,
        "admin_notes": feedback.admin_notes,
        "resolved_at": feedback.resolved_at
    }

@router.post("/admin/tokens")
def generate_tokens(
    request: TokenGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Generate feedback tokens for distribution"""
    if request.count < 1 or request.count > 1000:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 1000")
    
    tokens = []
    for _ in range(request.count):
        # Generate unique token
        token = secrets.token_urlsafe(16)
        token_obj = FeedbackToken(token=token)
        db.add(token_obj)
        tokens.append(token)
    
    db.commit()
    
    return {
        "count": len(tokens),
        "tokens": tokens
    }

@router.get("/admin/tokens/stats")
def get_token_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get token usage statistics"""
    total = db.query(FeedbackToken).count()
    used = db.query(FeedbackToken).filter(FeedbackToken.used == True).count()
    unused = total - used
    
    return {
        "total": total,
        "used": used,
        "unused": unused
    }

