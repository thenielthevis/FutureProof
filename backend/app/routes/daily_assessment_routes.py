from fastapi import APIRouter, HTTPException, Depends
from ..services.daily_assessment_service import create_daily_assessment, get_daily_assessment
from ..services.user_service import UserService
from ..dependencies import get_current_user
from ..models.user_model import UserInDB
import traceback

router = APIRouter()

@router.post("/daily-assessment/")
async def generate_daily_assessment(user: dict = Depends(get_current_user)):
    """Generate and return the daily assessment for the logged-in user."""
    assessment = await create_daily_assessment(user.id)
    return {"message": "Daily assessment generated successfully", "assessment": assessment}

@router.get("/daily-assessment/")
async def fetch_daily_assessment(current_user: UserInDB = Depends(get_current_user)):
    try:
        print(f"Authenticated User: {current_user}")  # Debug log
        daily_assessment = await get_daily_assessment(current_user.id)
        
        if not daily_assessment:
            # If no assessment is found, set health to 0
            await UserService.update_user_health(current_user.id, 0)
            print(f"No daily assessment found. Setting health to 0 for user {current_user.id}")
            return {"message": "No daily assessment found. Health set to 0."}

        return daily_assessment
    except Exception as e:
        print("Error fetching daily assessment:", traceback.format_exc())  # Detailed traceback
        raise HTTPException(status_code=500, detail="Internal Server Error")
