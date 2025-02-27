from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from app.models.meditation_breathing_model import MeditationBreathing
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin
from app.services.meditation_breathing_service import (
    create_meditation_breathing,
    read_meditation_breathing,
    read_meditation_breathing_by_id,
    update_meditation_breathing,
    delete_meditation_breathing,
)
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/meditation_breathing", tags=["Meditation & Breathing"])

class MeditationBreathingCreate(BaseModel):
    name: str
    description: str

class MeditationBreathingUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Create a meditation or breathing item
@router.post("/", response_model=MeditationBreathing, status_code=status.HTTP_201_CREATED)
async def create_meditation_breathing_route(
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    instructions: Optional[List[str]] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin),
):
    try:
        logger.info(f"Creating meditation/breathing item: {name}")
        return await create_meditation_breathing(name, description, file, instructions)
    except HTTPException as e:
        logger.error(f"HTTP error creating meditation/breathing item: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error creating meditation/breathing item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )

# Read all meditation and breathing items
@router.get("/", response_model=List[MeditationBreathing])
async def read_meditation_breathing_route():
    try:
        logger.info("Fetching all meditation/breathing items")
        return await read_meditation_breathing()
    except Exception as e:
        logger.error(f"Error fetching meditation/breathing items: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )

# Read a specific meditation or breathing item by ID
@router.get("/{item_id}", response_model=MeditationBreathing)
async def read_meditation_breathing_by_id_route(item_id: str):
    try:
        logger.info(f"Fetching meditation/breathing item with ID: {item_id}")
        return await read_meditation_breathing_by_id(item_id)
    except HTTPException as e:
        logger.error(f"HTTP error fetching meditation/breathing item: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error fetching meditation/breathing item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )

# Update a meditation or breathing item
@router.put("/{item_id}", response_model=MeditationBreathing)
async def update_meditation_breathing_route(
    item_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    instructions: Optional[List[str]] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin),
):
    try:
        logger.info(f"Updating meditation/breathing item with ID: {item_id}")
        return await update_meditation_breathing(item_id, name, description, file, instructions)
    except HTTPException as e:
        logger.error(f"HTTP error updating meditation/breathing item: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error updating meditation/breathing item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )

# Delete a meditation or breathing item
@router.delete("/{item_id}", response_model=MeditationBreathing)
async def delete_meditation_breathing_route(
    item_id: str, current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        logger.info(f"Deleting meditation/breathing item with ID: {item_id}")
        return await delete_meditation_breathing(item_id)
    except HTTPException as e:
        logger.error(f"HTTP error deleting meditation/breathing item: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error deleting meditation/breathing item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )