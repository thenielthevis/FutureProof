from pydantic import BaseModel, Field
from typing import List
from bson import ObjectId

class DiseasePrediction(BaseModel):
    condition: str
    details: str

class UserInfo(BaseModel):
    header: str
    details: str

class PredictionResponse(BaseModel):
    user_info: UserInfo
    predicted_diseases: List[DiseasePrediction]
    positive_habits: List[str]
    areas_for_improvement: List[str]
    recommendations: List[str]

class PredictionInDB(PredictionResponse):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: str

    class Config:
        arbitrary_types_allowed = True