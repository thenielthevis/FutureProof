from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.models.avatar_model import Avatar
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin, get_current_user
from app.services.avatar_service import create_avatar, read_avatars, read_avatar_by_id, update_avatar, delete_avatar

router = APIRouter()

class AvatarCreate(BaseModel):
    name: str
    description: str

# Create an avatar
@router.post("/create/avatar/", response_model=Avatar)
async def create_avatar_route(
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    current_admin: UserInDB = Depends(get_current_admin)
):
    return await create_avatar(name, description, file)

# Read avatars
@router.get("/avatars/", response_model=List[Avatar])
async def read_avatars_route():
    return await read_avatars()

# Read a specific avatar by ID
@router.get("/avatars/{avatar_id}", response_model=Avatar)
async def read_avatar_route(avatar_id: str):
    return await read_avatar_by_id(avatar_id)

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
    return await update_avatar(avatar_id, name, description, file)

# Delete an avatar
@router.delete("/delete/avatar/{avatar_id}", response_model=Avatar)
async def delete_avatar_route(avatar_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    return await delete_avatar(avatar_id)