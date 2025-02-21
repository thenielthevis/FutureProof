from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from typing import Optional, List

# Convert ObjectId to string for serialization
def str_objectid(id: ObjectId) -> str:
    return str(id)

# Custom Pydantic model for ObjectId
class ObjectIdModel(BaseModel):
    id: Optional[ObjectId] = Field(default=None, alias="_id")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str_objectid
        }

# Extended UserCreate model to include all fields from the frontend
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"  # Ensure default value is set
    age: int
    gender: str
    height: float
    weight: float
    environment: str
    vices: List[str] = []
    genetic_diseases: List[str] = []
    lifestyle: List[str] = []
    food_intake: List[str] = []
    sleep_hours: str
    activeness: str
    verified: bool = False

    class Config:
        json_encoders = {
            ObjectId: str_objectid
        }
        arbitrary_types_allowed = True

# This model is for internal representation in the database (MongoDB)
class UserInDB(ObjectIdModel):
    username: str
    email: EmailStr
    hashed_password: str
    role: str
    age: int
    gender: str
    height: float
    weight: float
    environment: str
    vices: List[str] = []
    genetic_diseases: List[str] = []
    lifestyle: List[str] = []
    food_intake: List[str] = []
    sleep_hours: str
    activeness: str
    avatars: List[ObjectId] = []
    default_avatar: Optional[ObjectId] = None
    coins: int = 0
    level: int = 1
    xp: int = 0
    otp: Optional[str] = None  # Add OTP field
    verified: bool = False

    class Config:
        json_encoders = {
            ObjectId: str_objectid
        }
        arbitrary_types_allowed = True

# This model is for the login input
class UserLogin(BaseModel):
    email: EmailStr
    password: str