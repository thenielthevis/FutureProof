from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional

# Update Achievement Model to handle string IDs like DailyRewards
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source, handler):
        return handler.generate_schema(str)

class Achievement(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    description: str
    coins: Optional[int] = 0
    xp: Optional[int] = 0
    requirements: str
    avatar_id: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
