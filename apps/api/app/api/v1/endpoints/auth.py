from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db
from app.models.user import User, Profile
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    roll_no: str | None = None  # for students
    role: str = "student"  # student | faculty | admin

    @field_validator('role')
    def validate_role(cls, v):
        if v not in ['student', 'faculty', 'admin']:
            raise ValueError('Role must be student, faculty, or admin')
        return v
    
    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/signup", response_model=TokenResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # For students, validate roll_no
    if request.role == "student":
        if not request.roll_no:
            raise HTTPException(status_code=400, detail="Roll number required for students")
        existing_roll = db.query(Profile).filter(Profile.roll_no == request.roll_no).first()
        if existing_roll:
            raise HTTPException(status_code=400, detail="Roll number already registered")
    
    # For faculty, validate email domain if configured
    if request.role == "faculty" and settings.FACULTY_EMAIL_DOMAIN:
        if not request.email.endswith(f"@{settings.FACULTY_EMAIL_DOMAIN}"):
            raise HTTPException(status_code=400, detail=f"Faculty must use @{settings.FACULTY_EMAIL_DOMAIN} email")
    
    # Create user
    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        role=request.role,
        verified=True  # Auto-verify for now, can add email verification later
    )
    db.add(user)
    db.flush()  # Get user.id
    
    # Create profile
    profile = Profile(
        user_id=user.id,
        name=request.name,
        roll_no=request.roll_no if request.role == "student" else None
    )
    db.add(profile)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        msg = str(e.orig)
        # Map common unique constraint errors
        if 'profiles_roll_no_key' in msg or 'unique constraint' in msg and 'roll_no' in msg:
            raise HTTPException(status_code=400, detail="Roll number already registered")
        if 'users_email_key' in msg or ('email' in msg and 'unique' in msg.lower()):
            raise HTTPException(status_code=400, detail="Email already registered")
        logger.exception("Signup failed: %s", msg)
        raise HTTPException(status_code=400, detail="Could not create account")
    db.refresh(user)
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": profile.name,
            "role": user.role,
            "roll_no": profile.roll_no
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Get profile
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": profile.name if profile else None,
            "role": user.role,
            "roll_no": profile.roll_no if profile else None
        }
    }

@router.get("/check-roll/{roll_no}")
def check_roll(roll_no: str, db: Session = Depends(get_db)):
    existing = db.query(Profile).filter(Profile.roll_no == roll_no).first()
    return {"available": existing is None}

