from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional

# Custom ObjectId Type for Pydantic v2
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source, handler):
        return handler.generate_schema(str)

# Achievement Model
class Achievement(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    description: str
    coins: Optional[int] = 0
    xp: Optional[int] = 0
    requirements: str
    avatar_id: Optional[str] = None  # Store ObjectId as a string

    class Config:
        from_attributes = True  # Needed for MongoDB document conversion
        populate_by_name = True
