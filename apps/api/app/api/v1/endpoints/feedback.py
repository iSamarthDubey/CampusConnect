from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/submit")
def submit_feedback():
    # TODO: submit anonymous feedback with token
    raise HTTPException(status_code=501, detail="Not implemented")

@router.get("/admin/list")
def list_feedback_admin():
    # TODO: admin view all feedback
    raise HTTPException(status_code=501, detail="Not implemented")

@router.post("/admin/tokens")
def generate_tokens():
    # TODO: admin generate feedback tokens
    raise HTTPException(status_code=501, detail="Not implemented")

