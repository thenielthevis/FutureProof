from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional

# Custom ObjectId Type for Pydantic v2
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source, handler):
        return handler.generate_schema(str)

# DailyReward Model
class DailyReward(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    day: int
    coins: Optional[int] = 0
    avatar: Optional[PyObjectId] = None  # Store ObjectId as a string

    class Config:
        from_attributes = True  # Needed for MongoDB document conversion
        populate_by_name = True
