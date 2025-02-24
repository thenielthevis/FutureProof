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

class DailyRewardClaim(BaseModel):
    user_id: str
    reward_id: str  # Ensure reward_id field is included
    coins: int = 0
    xp: int = 0
    avatar_id: Optional[str] = None
    asset_id: Optional[str] = None
    next_claim_time: Optional[str] = None