from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.models.physical_activity_model import PhysicalActivity
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin
from app.services.physical_activity_service import create_physical_activity, read_physical_activity, read_physical_activity_by_id, update_physical_activity, delete_physical_activity

router = APIRouter()

class PhysicalActivityCreate(BaseModel):
    activity_name: str
    activity_type: str
    description: str

# Create a physical activity item
@router.post("/create/physical_activity/", response_model=PhysicalActivity)
async def create_physical_activity_route(
    activity_name: str = Form(...),
    activity_type: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    instructions: Optional[list[str]] = Form(None),
    repetition: Optional[int] = Form(None),
    timer: Optional[int] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        # Log the received data for debugging
        print(f"Received data - Activity Name: {activity_name}, Activity Type: {activity_type}, Description: {description}, File: {file.filename}, ContentType: {file.content_type}")
        return await create_physical_activity(activity_name, activity_type, description, file, instructions, repetition, timer)
    except HTTPException as e:
        print(f"Error creating physical_activity: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error creating physical_activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read physical activity items
@router.get("/physical_activity/", response_model=List[PhysicalActivity])
async def read_physical_activity_route():
    try:
        return await read_physical_activity()
    except Exception as e:
        print(f"Error reading physical_activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read a specific physical activity item by ID
@router.get("/physical_activity/{item_id}", response_model=PhysicalActivity)
async def read_physical_activity_route(item_id: str):
    try:
        return await read_physical_activity_by_id(item_id)
    except Exception as e:
        print(f"Error reading physical_activity by ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

class PhysicalActivityUpdate(BaseModel):
    activity_name: Optional[str] = None
    activity_type: Optional[str] = None
    description: Optional[str] = None

# Update a physical activity item
@router.put("/update/physical_activity/{item_id}", response_model=PhysicalActivity)
async def update_physical_activity_route(
    item_id: str,
    activity_name: Optional[str] = Form(None),
    activity_type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    instructions: Optional[list[str]] = Form(None),
    repetition: Optional[int] = Form(None),
    timer: Optional[int] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        return await update_physical_activity(item_id, activity_name, activity_type, description, file, instructions, repetition, timer)
    except Exception as e:
        print(f"Error updating physical_activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Delete a physical activity item
@router.delete("/delete/physical_activity/{item_id}", response_model=PhysicalActivity)
async def delete_physical_activity_route(item_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    try:
        return await delete_physical_activity(item_id)
    except Exception as e:
        print(f"Error deleting physical_activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
