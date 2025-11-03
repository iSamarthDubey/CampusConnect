from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import requests
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
import uuid

router = APIRouter()

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"

    # Supabase Storage REST upload (service role key)
    upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/lost_items/{filename}"
    contents = await file.read()
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": file.content_type,
        "x-upsert": "true",
    }
    try:
        resp = requests.post(upload_url, headers=headers, data=contents, timeout=30)
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"Upload failed: {resp.status_code} {resp.text}")
        # Public URL (bucket must allow public read)
        public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/lost_items/{filename}"
        return {"url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

