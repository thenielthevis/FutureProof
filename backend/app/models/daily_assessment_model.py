from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional, List, Dict
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

class AssessmentDiseaseUpdate(BaseModel):
    condition: str
    previous_likelihood: str
    updated_likelihood: str
    changes: Optional[str] = None  # Reason for change

class DailyAssessment(BaseModel):
    user_id: str
    date: datetime
    task_summary: List[dict]
    nutritional_analysis: dict
    updated_predictions: List[dict]
    recommendations: List[str]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str_objectid
        }