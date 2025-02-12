from fastapi import Depends, HTTPException, status
from app.models.user_model import UserInDB
from app.utils import get_current_user

async def get_current_user_role(current_user: UserInDB = Depends(get_current_user)):
    return current_user.role

async def is_admin(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user

async def is_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user
