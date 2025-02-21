from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.models.meditation_breathing_model import MeditationBreathing
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin
from app.services.meditation_breathing_service import create_meditation_breathing, read_meditation_breathing, read_meditation_breathing_by_id, update_meditation_breathing, delete_meditation_breathing

router = APIRouter()

class MeditationBreathingCreate(BaseModel):
    name: str
    description: str

# Create a meditation or breathing item
@router.post("/create/meditation_breathing/", response_model=MeditationBreathing)
async def create_meditation_breathing_route(
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    instructions: Optional[list[str]] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        # Log the received data for debugging
        print(f"Received data - Name: {name}, Description: {description}, File: {file.filename}, ContentType: {file.content_type}")
        return await create_meditation_breathing(name, description, file, instructions)
    except HTTPException as e:
        print(f"Error creating meditation_breathing: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error creating meditation_breathing: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read meditation and breathing items
@router.get("/meditation_breathing/", response_model=List[MeditationBreathing])
async def read_meditation_breathing_route():
    try:
        return await read_meditation_breathing()
    except Exception as e:
        print(f"Error reading meditation_breathing: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read a specific meditation or breathing item by ID
@router.get("/meditation_breathing/{item_id}", response_model=MeditationBreathing)
async def read_meditation_breathing_route(item_id: str):
    try:
        return await read_meditation_breathing_by_id(item_id)
    except Exception as e:
        print(f"Error reading meditation_breathing by ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

class MeditationBreathingUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Update a meditation or breathing item
@router.put("/update/meditation_breathing/{item_id}", response_model=MeditationBreathing)
async def update_meditation_breathing_route(
    item_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    instructions: Optional[list[str]] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        return await update_meditation_breathing(item_id, name, description, file, instructions)
    except Exception as e:
        print(f"Error updating meditation_breathing: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Delete a meditation or breathing item
@router.delete("/delete/meditation_breathing/{item_id}", response_model=MeditationBreathing)
async def delete_meditation_breathing_route(item_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    try:
        return await delete_meditation_breathing(item_id)
    except Exception as e:
        print(f"Error deleting meditation_breathing: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")