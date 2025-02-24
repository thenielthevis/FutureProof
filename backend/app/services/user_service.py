from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
from typing import Optional
from bson import ObjectId
from app.config import get_database
from app.models.user_model import UserCreate, UserInDB, UserLogin
from jose import JWTError, jwt
from app.database import get_user_by_email
from fastapi import HTTPException
import random
from app.mailtrap_client import send_otp_email  # Update the path to the correct module

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))  # Default to 30 minutes if not found

db = get_database()

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def register_user(user: UserCreate):
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        return None
    
    hashed_password = get_password_hash(user.password)
    otp = str(random.randint(100000, 999999))  # Generate a 6-digit OTP
    user_in_db = UserInDB(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        age=user.age,
        gender=user.gender,
        height=user.height,
        weight=user.weight,
        environment=user.environment,
        vices=user.vices,
        genetic_diseases=user.genetic_diseases,
        lifestyle=user.lifestyle,
        food_intake=user.food_intake,
        sleep_hours=user.sleep_hours,
        activeness=user.activeness,
        role=user.role,
        id=ObjectId(),
        otp=otp,  # Add OTP field
        verified=False  # Set verified to False initially
    )
    await db.users.insert_one(user_in_db.dict(by_alias=True, exclude={"id"}))
    send_otp_email(user.email, otp)  # Send OTP email
    return user_in_db

async def authenticate_user(email: str, password: str):
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user['hashed_password']):
        return None
    return UserInDB(**user)

async def login_user(user: UserLogin):
    user_in_db = await db.users.find_one({"email": user.email})
    if not user_in_db:
        return None
    user_in_db = UserInDB(**user_in_db)
    if not verify_password(user.password, user_in_db.hashed_password):
        return None
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user_in_db.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "role": user_in_db.role}

# Function to get user by token
async def get_user_by_token(token: str) -> UserInDB:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = await get_user_by_email(email)
        return user
    except JWTError:
        return None

# Function to update user's coins and XP
async def update_user_coins_and_xp(user_id: str, coins: int = 0, xp: int = 0):
    db = get_database()
    user = await db["users"].find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_coins = user.get("coins", 0) + coins
    new_xp = user.get("xp", 0) + xp

    await db["users"].update_one({"_id": user_id}, {"$set": {"coins": new_coins, "xp": new_xp}})
    return {"coins": new_coins, "xp": new_xp}

async def verify_user_otp(email: str, otp: str):
    user = await db.users.find_one({"email": email})
    if not user or user.get("otp") != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    await db.users.update_one({"email": email}, {"$set": {"verified": True, "otp": None}})
    return {"message": "User verified successfully"}
