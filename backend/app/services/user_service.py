from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
from typing import Optional, List
from bson import ObjectId
from app.config import get_database
from app.models.user_model import UserCreate, UserInDB, UserLogin
from jose import JWTError, jwt
from app.database import get_user_by_email
from fastapi import HTTPException
import random
from app.mailtrap_client import send_otp_email  # Update the path to the correct module
import asyncio

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
    
async def get_user_by_token_health_xp(user_id: str):
    from bson import ObjectId  # Ensure you have imported ObjectId
    
    try:
        # Convert to ObjectId before querying MongoDB
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        return user
    except Exception as e:
        print("Error fetching user by token:", str(e))
        return None

# Function to update user's coins and XP
async def update_user_coins_and_xp(user_id: str, coins: int = 0, xp: int = 0):
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_coins = user.get("coins", 0) + coins
    new_xp = user.get("xp", 0) + xp
    new_level = user.get("level", 1)

    print(f"Initial XP: {user.get('xp', 0)}, New XP: {new_xp}, Initial Level: {new_level}")

    # Level-up logic
    xp_threshold = 100 * new_level
    while new_xp >= xp_threshold:
        new_xp -= xp_threshold
        new_level += 1
        xp_threshold = 100 * new_level
        print(f"Level up! New Level: {new_level}, Remaining XP: {new_xp}, Next XP Threshold: {xp_threshold}")

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"coins": new_coins, "xp": new_xp, "level": new_level}}
    )
    return {"coins": new_coins, "xp": new_xp, "level": new_level}

async def verify_user_otp(email: str, otp: str):
    user = await db.users.find_one({"email": email})
    if not user or user.get("otp") != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    await db.users.update_one({"email": email}, {"$set": {"verified": True, "otp": None}})
    return {"message": "User verified successfully"}

async def count_total_users():
    total_users = await db.users.count_documents({})
    return total_users

async def toggle_sleep_status(user_id: str):
    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_is_asleep = not user.get("isasleep", False)

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"isasleep": new_is_asleep}}
    )

    if new_is_asleep:
        asyncio.create_task(increment_sleep(user_id))

    return {"isasleep": new_is_asleep}

# Function to increment sleep every minute if user is asleep
async def increment_sleep(user_id: str):
    db = get_database()
    
    while True:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("isasleep"):
            break

        current_sleep = user.get("sleep", 0)
        if current_sleep < 100:
            await db["users"].update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"sleep": 1}}
            )

        await asyncio.sleep(60)  # Wait for 60 seconds before the next increment

# Function to increase user's medication by 50
async def increase_medication(user_id: str):
    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current_medication = user.get("medication", 0)
    if current_medication < 100:
        new_medication = min(current_medication + 25, 100)
        await db["users"].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"medication": new_medication}}
        )
    else:
        new_medication = current_medication

    return {"medication": new_medication}

async def get_user_registrations():
    db = get_database()
    now = datetime.utcnow()
    one_week_ago = now - timedelta(weeks=1)
    one_month_ago = now - timedelta(days=30)

    weekly_registrations = await db.users.count_documents({"registerDate": {"$gte": one_week_ago}})
    monthly_registrations = await db.users.count_documents({"registerDate": {"$gte": one_month_ago}})

    return {
        "weekly_registrations": weekly_registrations,
        "monthly_registrations": monthly_registrations,
    }

async def get_user_registrations_by_date():
    db = get_database()
    now = datetime.utcnow()
    one_week_ago = now - timedelta(weeks=1)
    one_month_ago = now - timedelta(days=30)

    pipeline = [
        {
            "$match": {
                "registerDate": {"$gte": one_month_ago}
            }
        },
        {
            "$group": {
                "_id": {
                    "dayOfWeek": {"$dayOfWeek": "$registerDate"},
                    "month": {"$month": "$registerDate"}
                },
                "count": {"$sum": 1}
            }
        }
    ]

    registrations = await db.users.aggregate(pipeline).to_list(length=None)

    weekly_registrations = [0] * 7
    monthly_registrations = [0] * 12

    for reg in registrations:
        day_of_week = reg["_id"]["dayOfWeek"] - 1  # MongoDB's $dayOfWeek returns 1 (Sunday) to 7 (Saturday)
        month = reg["_id"]["month"] - 1  # MongoDB's $month returns 1 (January) to 12 (December)
        count = reg["count"]

        if day_of_week >= 0 and day_of_week < 7:
            weekly_registrations[day_of_week] += count
        if month >= 0 and month < 12:
            monthly_registrations[month] += count

    return {
        "weekly_registrations": weekly_registrations,
        "monthly_registrations": monthly_registrations,
    }

async def update_user_level_and_xp(user_id: str):
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_xp = user.get("xp", 0)
    new_level = user.get("level", 1)

    print(f"Initial XP: {user.get('xp', 0)}, New XP: {new_xp}, Initial Level: {new_level}")

    # Level-up logic
    xp_threshold = 100 * new_level
    while new_xp >= xp_threshold:
        new_xp -= xp_threshold
        new_level += 1
        xp_threshold = 100 * new_level
        print(f"Level up! New Level: {new_level}, Remaining XP: {new_xp}, Next XP Threshold: {xp_threshold}")

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"xp": new_xp, "level": new_level}}
    )
    return {"xp": new_xp, "level": new_level}

async def get_avatar_details(avatar_ids: List[str]):
    try:
        # Ensure avatar_ids are valid ObjectIds
        object_ids = [ObjectId(aid) for aid in avatar_ids if ObjectId.is_valid(aid)]
        
        # Fetch avatars from the database
        avatars = await db.avatars.find({"_id": {"$in": object_ids}}).to_list(length=None)

        # Convert ObjectId to string for JSON serialization
        for avatar in avatars:
            avatar["_id"] = str(avatar["_id"])
        
        return avatars
    except Exception as e:
        print("Error fetching avatars:", str(e))
        return []

class UserService:
    @staticmethod
    async def update_user_battery(user_id: str, battery: int) -> UserInDB:
        try:
            print(f"Updating battery for user_id: {user_id} with battery: {battery}")
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                raise Exception("User not found")
            result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"battery": battery}})
            if result.modified_count == 1:
                updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
                return UserInDB(**updated_user)
            else:
                raise Exception("No document was modified")
        except Exception as e:
            print("Error in update_user_battery:", str(e))
            raise

    @staticmethod
    async def update_user_health(user_id: str, health: int) -> UserInDB:
        try:
            print(f"Updating health for user_id: {user_id} with health: {health}")

            result = await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"health": health}}  # Always set health, no conditions
            )

            # Debugging info
            print(f"Modified Count: {result.modified_count}")

            # Fetch and return the updated user
            updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
            if updated_user:
                return UserInDB(**updated_user)
            else:
                raise Exception("User not found after update")
        except Exception as e:
            print("Error in update_user_health:", str(e))
            raise

    @staticmethod
    async def update_user_level_and_xp(user_id: str):
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        new_xp = user.get("xp", 0)
        new_level = user.get("level", 1)

        print(f"Initial XP: {user.get('xp', 0)}, New XP: {new_xp}, Initial Level: {new_level}")

        # Level-up logic
        xp_threshold = 100 * new_level
        while new_xp >= xp_threshold:
            new_xp -= xp_threshold
            new_level += 1
            xp_threshold = 100 * new_level
            print(f"Level up! New Level: {new_level}, Remaining XP: {new_xp}, Next XP Threshold: {xp_threshold}")

        await db["users"].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"xp": new_xp, "level": new_level}}
        )
        return {"xp": new_xp, "level": new_level}

    @staticmethod
    async def update_user_coins_and_xp(user_id: str, coins: int = 0, xp: int = 0):
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        new_coins = user.get("coins", 0) + coins
        new_xp = user.get("xp", 0) + xp
        new_level = user.get("level", 1)

        print(f"Initial XP: {user.get('xp', 0)}, New XP: {new_xp}, Initial Level: {new_level}")

        # Level-up logic
        xp_threshold = 100 * new_level
        while new_xp >= xp_threshold:
            new_xp -= xp_threshold
            new_level += 1
            xp_threshold = 100 * new_level
            print(f"Level up! New Level: {new_level}, Remaining XP: {new_xp}, Next XP Threshold: {xp_threshold}")

        await db["users"].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"coins": new_coins, "xp": new_xp, "level": new_level}}
        )
        return {"coins": new_coins, "xp": new_xp, "level": new_level}