from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.models.avatar_model import Avatar
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin, get_current_user
from app.services.avatar_service import create_avatar, read_avatars, read_avatar_by_id, update_avatar, delete_avatar, claim_avatar, get_avatar_icon

router = APIRouter()

class AvatarCreate(BaseModel):
    name: str
    description: str

class AvatarClaim(BaseModel):
    avatar_id: str

# Create an avatar
@router.post("/create/avatar/", response_model=Avatar)
async def create_avatar_route(
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        # Log the received data for debugging
        print(f"Received data - Name: {name}, Description: {description}, File: {file.filename}, ContentType: {file.content_type}")
        return await create_avatar(name, description, file)
    except HTTPException as e:
        print(f"Error creating avatar: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error creating avatar: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read avatars
@router.get("/avatars/", response_model=List[Avatar])
async def read_avatars_route():
    try:
        return await read_avatars()
    except Exception as e:
        print(f"Error reading avatars: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read a specific avatar by ID
@router.get("/avatars/{avatar_id}", response_model=Avatar)
async def read_avatar_route(avatar_id: str):
    try:
        return await read_avatar_by_id(avatar_id)
    except Exception as e:
        print(f"Error reading avatar by ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

class AvatarUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Update an avatar
@router.put("/update/avatar/{avatar_id}", response_model=Avatar)
async def update_avatar_route(
    avatar_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        return await update_avatar(avatar_id, name, description, file)
    except Exception as e:
        print(f"Error updating avatar: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Delete an avatar
@router.delete("/delete/avatar/{avatar_id}", response_model=Avatar)
async def delete_avatar_route(avatar_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    try:
        return await delete_avatar(avatar_id)
    except Exception as e:
        print(f"Error deleting avatar: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Claim an avatar by ID
@router.post("/avatars/claim", response_model=Avatar)
async def claim_avatar_route(
    avatar_claim: AvatarClaim,
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        return await claim_avatar(avatar_claim.avatar_id, current_user)
    except Exception as e:
        print(f"Error claiming avatar: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Get avatar icon by name
@router.get("/avatars/icon/{avatar_name}", response_model=Avatar)
async def get_avatar_icon_route(avatar_name: str):
    try:
        decoded_avatar_name = avatar_name.replace('%2F', '/')  # Decode the URL-encoded name
        return await get_avatar_icon(decoded_avatar_name)
    except Exception as e:
        print(f"Error getting avatar icon: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")