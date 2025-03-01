from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from app.services.user_service import (register_user, login_user, get_user_by_token, toggle_sleep_status, increase_medication, count_total_users, get_user_registrations, get_user_registrations_by_date, UserService, get_user_by_token_health_xp, get_avatar_details)
from app.models.user_model import UserCreate, UserLogin, UserInDB
from app.models.avatar_model import Avatar
from app.mailtrap_client import send_otp_email
from typing import List, Optional
from bson import ObjectId
from app.dependencies import get_current_user
from app.config import get_database

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

db = get_database()

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class OTPRequest(BaseModel):
    email: str
    otp: str

class BatteryUpdateRequest(BaseModel):
    battery: int

class HealthUpdateRequest(BaseModel):
    health: int

class XPUpdateRequest(BaseModel):
    xp: int

class UserUpdate(BaseModel):
    default_avatar: Optional[str] = None

@router.post("/register")
async def register(user: UserCreate):
    print("Received user data:", user.dict())
    registered_user = await register_user(user)
    if not registered_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    return {"msg": "User registered successfully"}

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    print("Received user data:", user.dict())
    result = await login_user(user)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    print("Generated token:", result["access_token"])
    print("User role:", result["role"])
    return {"access_token": result["access_token"], "token_type": "bearer", "role": result["role"]}

@router.get("/user", response_model=UserInDB)
async def get_user(token: str = Depends(oauth2_scheme)):
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Fetch avatar details based on ObjectIDs in the avatars field
    avatar_ids = user.avatars if isinstance(user.avatars, list) else []
    avatars = await get_avatar_details(avatar_ids)
    user.avatars = avatars
    
    return user

# Separate route to fetch avatars for a user
@router.get("/user/avatars", response_model=List[Avatar])
async def get_user_avatars(token: str = Depends(oauth2_scheme)):
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Fetch avatar details based on ObjectIDs in the avatars field
    avatar_ids = user.avatars if isinstance(user.avatars, list) else []
    avatars = await get_avatar_details(avatar_ids)
    
    # Ensure _id is an ObjectId
    for avatar in avatars:
        avatar["_id"] = ObjectId(avatar["_id"])
    
    return avatars

@router.put("/user", response_model=UserInDB)
async def update_user(user_update: UserUpdate, current_user: UserInDB = Depends(get_current_user)):
    try:
        update_data = user_update.dict(exclude_unset=True)
        if "default_avatar" in update_data:
            update_data["default_avatar"] = ObjectId(update_data["default_avatar"])
        await db.users.update_one({"_id": current_user.id}, {"$set": update_data})
        updated_user = await db.users.find_one({"_id": current_user.id})
        return UserInDB(**updated_user)
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to update user")

@router.get("/total-users")
async def get_total_users():
    total_users = await count_total_users()
    return {"total_users": total_users}

@router.post("/send-otp/")
async def send_otp(request: OTPRequest):
    try:
        send_otp_email(request.email, request.otp)
        return {"message": "OTP sent successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/user/sleep-toggle")
async def toggle_sleep(token: str = Depends(oauth2_scheme)):
    try:
        user = await get_user_by_token(token)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        result = await toggle_sleep_status(str(user.id))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/user/increase-medication")
async def increase_med(token: str = Depends(oauth2_scheme)):
    try:
        user = await get_user_by_token(token)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        result = await increase_medication(str(user.id))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/user/battery")
async def update_user_battery(battery_update: BatteryUpdateRequest, current_user: UserInDB = Depends(get_current_user)):
    try:
        print(f"Received battery update request: {battery_update}")
        updated_user = await UserService.update_user_battery(current_user.id, battery_update.battery)
        return updated_user
    except Exception as e:
        print("Error updating user battery:", str(e))
        raise HTTPException(status_code=400, detail="Failed to update user battery")
    
@router.put("/user/health")
async def update_user_health(health_update: HealthUpdateRequest, current_user: UserInDB = Depends(get_current_user)):
    try:
        print(f"Received health update request: {health_update}")
        updated_user = await UserService.update_user_health(current_user.id, health_update.health)
        return updated_user
    except Exception as e:
        print("Error updating user health:", str(e))
        raise HTTPException(status_code=400, detail="Failed to update user health")

@router.put("/user/xp")
async def update_user_xp(xp_update: XPUpdateRequest, current_user: UserInDB = Depends(get_current_user)):
    try:
        print(f"Received XP update request: {xp_update}")
        updated_user = await UserService.update_user_coins_and_xp(current_user.id, xp=xp_update.xp)
        print(f"Updated user data: {updated_user}")
        return updated_user
    except Exception as e:
        print("Error updating user XP:", str(e))
        raise HTTPException(status_code=400, detail="Failed to update user XP")

@router.get("/user/level-xp")
async def get_user_level_and_xp(current_user: UserInDB = Depends(get_current_user)):
    try:
        user_id = str(current_user.id)  # Convert ObjectId to string
        user = await get_user_by_token_health_xp(user_id)  # Fetch user correctly
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"level": user["level"], "xp": user["xp"], "coins": user["coins"]}
    except Exception as e:
        print("Error fetching user level and XP:", str(e))
        raise HTTPException(status_code=400, detail="Failed to fetch user level and XP")

@router.put("/user/update-level-xp")
async def update_user_level_and_xp_route(current_user: UserInDB = Depends(get_current_user)):
    try:
        updated_user = await UserService.update_user_level_and_xp(str(current_user.id))
        return updated_user
    except Exception as e:
        print("Error updating user level and XP:", str(e))
        raise HTTPException(status_code=400, detail="Failed to update user level and XP")

@router.get("/user-registrations")
async def user_registrations():
    try:
        registrations = await get_user_registrations()
        return registrations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-registrations-by-date")
async def user_registrations_by_date():
    try:
        registrations = await get_user_registrations_by_date()
        return registrations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))