from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from app.models.physical_activity_model import PhysicalActivity
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin
from app.services.physical_activity_service import (
    create_physical_activity,
    read_physical_activity,
    read_physical_activity_by_id,
    update_physical_activity,
    delete_physical_activity,
)
from bson import ObjectId

router = APIRouter(prefix="/physical_activities", tags=["Physical Activities"])

# Pydantic model for creating a physical activity
class PhysicalActivityCreate(BaseModel):
    activity_name: str
    activity_type: str
    description: str
    url: HttpUrl
    public_id: str
    instructions: Optional[List[str]] = None
    repetition: Optional[int] = None
    timer: Optional[int] = None

# Pydantic model for updating a physical activity
class PhysicalActivityUpdate(BaseModel):
    activity_name: Optional[str] = None
    activity_type: Optional[str] = None
    description: Optional[str] = None
    url: Optional[HttpUrl] = None
    public_id: Optional[str] = None
    instructions: Optional[List[str]] = None
    repetition: Optional[int] = None
    timer: Optional[int] = None

# Create a physical activity
@router.post("/", response_model=PhysicalActivity, status_code=status.HTTP_201_CREATED)
async def create_physical_activity_route(
    activity_name: str = Form(...),
    activity_type: str = Form(...),
    description: str = Form(...),
    url: str = Form(...),
    public_id: str = Form(...),
    file: UploadFile = File(...),
    instructions: Optional[List[str]] = Form(None),
    repetition: Optional[int] = Form(None),
    timer: Optional[int] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin),
):
    try:
        # Log the received data for debugging
        print(f"Received data - Activity Name: {activity_name}, Activity Type: {activity_type}, Description: {description}, File: {file.filename}, ContentType: {file.content_type}")
        
        # Call the service function to create the activity
        return await create_physical_activity(
            activity_name=activity_name,
            activity_type=activity_type,
            description=description,
            url=url,
            public_id=public_id,
            file=file,
            instructions=instructions,
            repetition=repetition,
            timer=timer,
        )
    except HTTPException as e:
        print(f"Error creating physical activity: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error creating physical activity: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

# Get all physical activities
@router.get("/", response_model=List[PhysicalActivity])
async def read_physical_activities_route():
    try:
        return await read_physical_activity()
    except Exception as e:
        print(f"Error reading physical activities: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

# Get a specific physical activity by ID
@router.get("/{item_id}", response_model=PhysicalActivity)
async def read_physical_activity_route(item_id: str):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ObjectId format")
        return await read_physical_activity_by_id(item_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error reading physical activity by ID: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

# Update a physical activity
@router.put("/{item_id}", response_model=PhysicalActivity)
async def update_physical_activity_route(
    item_id: str,
    activity_name: Optional[str] = Form(None),
    activity_type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    public_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    instructions: Optional[List[str]] = Form(None),
    repetition: Optional[int] = Form(None),
    timer: Optional[int] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin),
):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ObjectId format")
        
        return await update_physical_activity(
            item_id=item_id,
            activity_name=activity_name,
            activity_type=activity_type,
            description=description,
            url=url,
            public_id=public_id,
            file=file,
            instructions=instructions,
            repetition=repetition,
            timer=timer,
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error updating physical activity: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

# Delete a physical activity
@router.delete("/{item_id}", response_model=PhysicalActivity)
async def delete_physical_activity_route(
    item_id: str,
    current_admin: UserInDB = Depends(get_current_admin),
):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ObjectId format")
        return await delete_physical_activity(item_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error deleting physical activity: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")