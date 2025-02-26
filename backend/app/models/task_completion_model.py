from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

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

class TaskCompletion(BaseModel):
    user_id: str
    task_type: str
    time_spent: Optional[int] = None
    coins_received: Optional[int] = None
    xp_received: Optional[int] = None
    score: Optional[int] = None
    total_questions: Optional[int] = None
    date_completed: datetime

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str_objectid
        }
