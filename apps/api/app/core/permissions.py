from fastapi import HTTPException, status, Depends
from app.core.security import get_current_user
from app.models.user import User

def require_role(*allowed_roles: str):
    """
    Dependency to check if user has required role
    Usage: current_user: User = Depends(require_role("admin", "faculty"))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_verified(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to check if user is verified"""
    if not current_user.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not verified. Please verify your email."
        )
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Shortcut for admin-only access"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_faculty_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Shortcut for faculty or admin access"""
    if current_user.role not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty or admin access required"
        )
    return current_user

