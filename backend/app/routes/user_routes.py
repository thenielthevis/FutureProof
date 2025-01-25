from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.user_service import register_user, login_user
from app.models.user_model import UserCreate, UserLogin

router = APIRouter()

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
    return {"access_token": access_token, "token_type": "bearer"}
