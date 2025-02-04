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
        id=ObjectId()  # MongoDB ObjectId
    )
    await db.users.insert_one(user_in_db.dict(exclude={"id"}))
    return user_in_db

async def authenticate_user(email: str, password: str):
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user['hashed_password']):
        return None
    return UserInDB(**user)

async def login_user(user: UserLogin):
    authenticated_user = await authenticate_user(user.email, user.password)
    if not authenticated_user:
        return None
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return access_token

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
