from fastapi import APIRouter, Depends
from ..services.daily_assessment_service import create_daily_assessment
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/daily-assessment")
async def generate_daily_assessment(user: dict = Depends(get_current_user)):
    """Generate and return the daily assessment for the logged-in user."""
    assessment = await create_daily_assessment(user.id)
    return {"message": "Daily assessment generated successfully", "assessment": assessment}