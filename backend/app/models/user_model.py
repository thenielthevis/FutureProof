from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from typing import Optional

# Convert ObjectId to string for serialization
def str_objectid(id: ObjectId) -> str:
    return str(id)

# Custom Pydantic model for ObjectId
class ObjectIdModel(BaseModel):
    id: Optional[ObjectId] = Field(default=None, alias="_id")

    class Config:
        arbitrary_types_allowed = True

# This will be used for registration
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# This model is for internal representation in the database (MongoDB)
class UserInDB(ObjectIdModel):
    username: str
    email: EmailStr
    hashed_password: str

    class Config:
        json_encoders = {
            ObjectId: str_objectid
        }

# This model is for the login input
class UserLogin(BaseModel):
    email: EmailStr
    password: str
