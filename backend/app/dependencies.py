from fastapi import Depends, HTTPException, status
from app.models.user_model import UserInDB
from app.auth import is_admin
from app.utils import get_current_user

async def get_current_admin(current_user: UserInDB = Depends(is_admin)):
    return current_user

async def get_current_user_role(current_user: UserInDB = Depends(get_current_user)):
    return current_user.role

async def get_current_user(current_user: UserInDB = Depends(get_current_user)):
    return current_user