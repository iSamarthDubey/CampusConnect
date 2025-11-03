from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User, Profile

router = APIRouter()

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    roll_no: str | None = None
    dept_id: int | None = None
    section_id: int | None = None
    avatar_url: str | None = None

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=profile.name,
        role=current_user.role,
        roll_no=profile.roll_no,
        dept_id=profile.dept_id,
        section_id=profile.section_id,
        avatar_url=profile.avatar_url
    )

class UpdateProfileRequest(BaseModel):
    name: str | None = None
    roll_no: str | None = None
    dept_id: int | None = None
    section_id: int | None = None
    hostel: str | None = None
    phone: str | None = None
    avatar_url: str | None = None

class ProfileResponse(BaseModel):
    name: str | None = None
    roll_no: str | None = None
    dept_id: int | None = None
    phone: str | None = None
    hostel: str | None = None
    avatar_url: str | None = None

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.patch("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if request.name is not None:
        profile.name = request.name
    if request.roll_no is not None:
        profile.roll_no = request.roll_no
    if request.dept_id is not None:
        profile.dept_id = request.dept_id
    if request.section_id is not None:
        profile.section_id = request.section_id
    if request.hostel is not None:
        profile.hostel = request.hostel
    if request.phone is not None:
        profile.phone = request.phone
    if request.avatar_url is not None:
        profile.avatar_url = request.avatar_url
    
    db.commit()
    db.refresh(profile)
    
    return {"message": "Profile updated successfully"}

# Departments
from app.models.department import Department
from typing import List as _List

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str

@router.get("/departments", response_model=_List[DepartmentResponse])
async def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).order_by(Department.name.asc()).all()
    return [{"id": d.id, "name": d.name, "code": d.code} for d in depts]

