from pydantic import BaseModel, Field
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

# Question-Answer model
class QuestionAnswer(BaseModel):
    question: str
    answer: str

# Nutritional Tracking model
class NutritionalTracking(ObjectIdModel):
    user_id: str
    prediction_id: ObjectId
    questions_answers: List[QuestionAnswer]
    date_tracked: datetime

    class Config:
        json_encoders = {
            ObjectId: str_objectid
        }
        arbitrary_types_allowed = True
