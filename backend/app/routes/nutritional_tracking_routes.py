from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from app.models.nutritional_tracking_model import NutritionalTracking, QuestionAnswer
from app.models.user_model import UserInDB
from app.dependencies import get_current_user
from app.services.nutritional_tracking_service import create_nutritional_tracking, read_nutritional_tracking, update_nutritional_tracking, get_past_nutritional_tracking_responses
from app.config import get_database
from bson import ObjectId

router = APIRouter()
db = get_database()

class NutritionalTrackingResponse(BaseModel):
    question_index: int
    answer: str

# Create a nutritional tracking entry
@router.post("/create/nutritional_tracking/", response_model=NutritionalTracking)
async def create_nutritional_tracking_route(current_user: UserInDB = Depends(get_current_user)):
    try:
        return await create_nutritional_tracking(str(current_user.id))
    except HTTPException as e:
        print(f"Error creating nutritional tracking: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error creating nutritional tracking: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read nutritional tracking entries for the current user
@router.get("/nutritional_tracking/", response_model=List[NutritionalTracking])
async def read_nutritional_tracking_route(current_user: UserInDB = Depends(get_current_user)):
    try:
        return await read_nutritional_tracking(str(current_user.id))
    except Exception as e:
        print(f"Error reading nutritional tracking: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Fetch nutritional tracking questions for the current user
@router.get("/nutritional_tracking/questions", response_model=NutritionalTracking)
async def get_nutritional_tracking_questions_route(current_user: UserInDB = Depends(get_current_user)):
    try:
        latest_tracking = await db.nutritional_tracking.find_one(
            {"user_id": str(current_user.id)}, sort=[("date_tracked", -1)]
        )
        if not latest_tracking:
            return await create_nutritional_tracking(str(current_user.id))
        return latest_tracking
    except Exception as e:
        print(f"Error fetching nutritional tracking questions: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Submit nutritional tracking responses
@router.post("/nutritional_tracking/responses", response_model=NutritionalTracking)
async def submit_nutritional_tracking_responses_route(
    response_data: NutritionalTrackingResponse, 
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        # Fetch the latest nutritional tracking entry for the user
        latest_tracking = await db.nutritional_tracking.find_one(
            {"user_id": str(current_user.id)}, sort=[("date_tracked", -1)]
        )
        if not latest_tracking:
            raise HTTPException(status_code=404, detail="Nutritional tracking entry not found")

        return await update_nutritional_tracking(str(latest_tracking["_id"]), response_data.question_index, response_data.answer)
    except Exception as e:
        print(f"Error submitting nutritional tracking responses: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Update a nutritional tracking entry
@router.put("/update/nutritional_tracking/{tracking_id}", response_model=NutritionalTracking)
async def update_nutritional_tracking_route(tracking_id: str, response_data: NutritionalTrackingResponse, current_user: UserInDB = Depends(get_current_user)):
    try:
        return await update_nutritional_tracking(tracking_id, response_data.question_index, response_data.answer)
    except Exception as e:
        print(f"Error updating nutritional tracking: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Fetch past nutritional tracking responses for the current user
@router.get("/nutritional_tracking/past_responses", response_model=List[QuestionAnswer])
async def get_past_nutritional_tracking_responses_route(current_user: UserInDB = Depends(get_current_user)):
    try:
        return await get_past_nutritional_tracking_responses(str(current_user.id))
    except Exception as e:
        print(f"Error fetching past nutritional tracking responses: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
