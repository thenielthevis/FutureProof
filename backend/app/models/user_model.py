from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from typing import Optional, List
from datetime import datetime

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
    registerDate: datetime = Field(default_factory=datetime.utcnow)  # Add registerDate field

    class Config:
        json_encoders = {
            ObjectId: str_objectid,
            datetime: lambda dt: dt.isoformat(),
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
    isasleep: bool = False
    sleep: int = Field(0, le=100)
    battery: int = Field(0, le=100)
    health: int = Field(0, le=100)
    medication: int = Field(0, le=100)
    claimed_rewards: List[ObjectId] = []
    next_claim_time: Optional[datetime] = None
    registerDate: datetime = Field(default_factory=datetime.utcnow)  # Add registerDate field
    lastLogin: Optional[datetime] = None  # Add lastLogin field
    disabled: bool = False  # Add disabled field

    class Config:
        json_encoders = {
            ObjectId: str_objectid,
            datetime: lambda dt: dt.isoformat(),
        }
        arbitrary_types_allowed = True

# Add this new model for profile updates
class UserProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    environment: Optional[str] = None
    vices: Optional[List[str]] = None
    genetic_diseases: Optional[List[str]] = None
    lifestyle: Optional[List[str]] = None
    food_intake: Optional[List[str]] = None
    sleep_hours: Optional[str] = None
    activeness: Optional[str] = None

# This model is for the login input
class UserLogin(BaseModel):
    email: EmailStr
    password: str