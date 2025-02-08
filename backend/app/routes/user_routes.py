from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from app.services.user_service import register_user, login_user, get_user_by_token
from app.services.prediction_service import predict_disease
from app.models.user_model import UserCreate, UserLogin, UserInDB
from typing import List

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Token(BaseModel):
    access_token: str
    token_type: str

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
    access_token = await login_user(user)
    if not access_token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    print("Generated token:", access_token)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/user", response_model=UserInDB)
async def get_user(token: str = Depends(oauth2_scheme)):
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
