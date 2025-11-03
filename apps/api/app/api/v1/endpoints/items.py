from fastapi import APIRouter, HTTPException, Depends, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.item import Item, ItemClaim
from app.models.user import Profile

router = APIRouter()

class CreateItemRequest(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None

class UpdateItemRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

class ItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    image_url: Optional[str]
    status: str
    category: Optional[str]
    location: Optional[str]
    finder_id: Optional[str]
    finder_name: Optional[str]
    claimant_id: Optional[str]
    claimant_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ClaimRequest(BaseModel):
    message: Optional[str] = None

class UpdateClaimRequest(BaseModel):
    status: str  # 'approved' | 'rejected' | 'pending' (pending used for undo)
    reason: Optional[str] = None

@router.get("/", response_model=List[ItemResponse])
@router.get("", response_model=List[ItemResponse])
def list_items(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    query = db.query(Item)
    
    if status:
        query = query.filter(Item.status == status)
    if category:
        query = query.filter(Item.category == category)
    if q:
        query = query.filter(
            (Item.title.ilike(f"%{q}%")) | (Item.description.ilike(f"%{q}%"))
        )
    
    items = query.order_by(Item.created_at.desc()).offset(offset).limit(limit).all()

    # Map user_id -> name for finder and claimant
    user_ids = set([i.finder_id for i in items if i.finder_id] + [i.claimant_id for i in items if i.claimant_id])
    name_map = {}
    if user_ids:
        profiles = db.query(Profile).filter(Profile.user_id.in_(list(user_ids))).all()
        name_map = {p.user_id: p.name for p in profiles}

    return [ItemResponse(
        id=i.id,
        title=i.title,
        description=i.description,
        image_url=i.image_url,
        status=i.status,
        category=i.category,
        location=i.location,
        finder_id=str(i.finder_id) if i.finder_id else None,
        finder_name=name_map.get(i.finder_id) if i.finder_id else None,
        claimant_id=str(i.claimant_id) if i.claimant_id else None,
        claimant_name=name_map.get(i.claimant_id) if i.claimant_id else None,
        created_at=i.created_at
    ) for i in items]

@router.post("/", response_model=ItemResponse)
@router.post("", response_model=ItemResponse)
async def create_item(
    request: CreateItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = Item(
        title=request.title,
        description=request.description,
        image_url=request.image_url,
        category=request.category,
        location=request.location,
        finder_id=current_user.id,
        status="active"
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return ItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        image_url=item.image_url,
        status=item.status,
        category=item.category,
        location=item.location,
        finder_id=str(item.finder_id) if item.finder_id else None,
        claimant_id=str(item.claimant_id) if item.claimant_id else None,
        created_at=item.created_at
    )

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Names
    finder_profile = db.query(Profile).filter(Profile.user_id == item.finder_id).first() if item.finder_id else None
    claimant_profile = db.query(Profile).filter(Profile.user_id == item.claimant_id).first() if item.claimant_id else None

    return ItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        image_url=item.image_url,
        status=item.status,
        category=item.category,
        location=item.location,
        finder_id=str(item.finder_id) if item.finder_id else None,
        finder_name=finder_profile.name if finder_profile else None,
        claimant_id=str(item.claimant_id) if item.claimant_id else None,
        claimant_name=claimant_profile.name if claimant_profile else None,
        created_at=item.created_at
    )

@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    request: UpdateItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Only finder or admin can update
    if item.finder_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if request.title is not None:
        item.title = request.title
    if request.description is not None:
        item.description = request.description
    if request.category is not None:
        item.category = request.category
    if request.location is not None:
        item.location = request.location
    if request.status is not None:
        item.status = request.status
    
    db.commit()
    db.refresh(item)
    
    return ItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        image_url=item.image_url,
        status=item.status,
        category=item.category,
        location=item.location,
        finder_id=str(item.finder_id) if item.finder_id else None,
        claimant_id=str(item.claimant_id) if item.claimant_id else None,
        created_at=item.created_at
    )

@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Only finder or admin can delete
    if item.finder_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Item deleted"}

@router.post("/{item_id}/claim")
async def claim_item(
    item_id: int,
    request: ClaimRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.status != "active":
        raise HTTPException(status_code=400, detail="Item is not available for claims")
    
    # Check if user already claimed
    existing = db.query(ItemClaim).filter(
        ItemClaim.item_id == item_id,
        ItemClaim.claimant_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already claimed this item")
    
    claim = ItemClaim(
        item_id=item_id,
        claimant_id=current_user.id,
        message=request.message,
        status="pending"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    
    return {"id": claim.id, "message": "Claim submitted"}

@router.get("/{item_id}/claims")
async def get_item_claims(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Only finder or admin can view claims
    if item.finder_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    claims = db.query(ItemClaim).filter(ItemClaim.item_id == item_id).all()
    # Add claimant names
    claimant_ids = [c.claimant_id for c in claims if c.claimant_id]
    profiles = db.query(Profile).filter(Profile.user_id.in_(claimant_ids)).all() if claimant_ids else []
    name_map = {p.user_id: p.name for p in profiles}
    return [{"id": c.id, "claimant_id": str(c.claimant_id), "claimant_name": name_map.get(c.claimant_id), "message": c.message, "status": c.status, "created_at": c.created_at} for c in claims]

@router.patch("/{item_id}/claims/{claim_id}")
async def update_claim(
    item_id: int,
    claim_id: int,
    payload: UpdateClaimRequest = Body(default=None),
    status: Optional[str] = None,  # fallback for legacy query param usage
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_status = (payload.status if payload else None) or status
    if new_status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Only finder or admin can update claims
    if item.finder_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    claim = db.query(ItemClaim).filter(
        ItemClaim.id == claim_id,
        ItemClaim.item_id == item_id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    previous_status = claim.status

    if new_status == "approved":
        # Approve this claim
        claim.status = "approved"
        item.status = "claimed"
        item.claimant_id = claim.claimant_id
        # Auto-reject all other pending claims for this item
        others = db.query(ItemClaim).filter(
            ItemClaim.item_id == item_id,
            ItemClaim.id != claim_id,
            ItemClaim.status == "pending",
        ).all()
        for c in others:
            c.status = "rejected"

    elif new_status == "rejected":
        # Reject this claim
        claim.status = "rejected"
        # If it was previously approved and belongs to current claimant, reopen item
        if previous_status == "approved" and item.claimant_id == claim.claimant_id:
            # If no other approved claims remain, mark item active
            other_approved = db.query(ItemClaim).filter(
                ItemClaim.item_id == item_id,
                ItemClaim.id != claim_id,
                ItemClaim.status == "approved",
            ).first()
            if not other_approved:
                item.status = "active"
                item.claimant_id = None

    elif new_status == "pending":
        # Undo: move back to pending
        if previous_status in ("approved", "rejected"):
            claim.status = "pending"
            if previous_status == "approved" and item.claimant_id == claim.claimant_id:
                # If no other approved claims, reopen item
                other_approved = db.query(ItemClaim).filter(
                    ItemClaim.item_id == item_id,
                    ItemClaim.id != claim_id,
                    ItemClaim.status == "approved",
                ).first()
                if not other_approved:
                    item.status = "active"
                    item.claimant_id = None

    db.commit()
    return {"message": f"Claim {new_status}"}

