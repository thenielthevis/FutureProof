from fastapi import APIRouter, HTTPException, Depends
from ..services.daily_assessment_service import create_daily_assessment, get_daily_assessment, read_all_assessments, read_user_assessments, check_assessment_requirements
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

@router.get("/daily-assessment/check-requirements")
async def check_requirements(current_user: UserInDB = Depends(get_current_user)):
    """Check if user meets requirements for daily assessment."""
    try:
        requirements = await check_assessment_requirements(current_user.id)
        return requirements
    except Exception as e:
        print("Error checking requirements:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/daily-assessments/")
async def fetch_all_assessments():
    try:
        assessments = await read_all_assessments()
        print(f"All Assessments: {assessments}")  # Log all assessments
        return {"assessments": assessments}
    except Exception as e:
        print("Error fetching all assessments:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/user-daily-assessments/")
async def fetch_user_assessments(current_user: UserInDB = Depends(get_current_user)):
    try:
        assessments = await read_user_assessments(current_user.id)
        print(f"User Assessments for {current_user.id}: {assessments}")  # Log user assessments
        return {"assessments": assessments}
    except Exception as e:
        print("Error fetching user assessments:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal Server Error")
