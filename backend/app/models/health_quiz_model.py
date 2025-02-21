from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId

# Convert ObjectId to string for serialization
def str_objectid(id: ObjectId) -> str:
    return str(id)

# Custom Pydantic model for ObjectId
class ObjectIdModel(BaseModel):
    id: Optional[ObjectId] = Field(default_factory=ObjectId, alias="_id")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str_objectid
        }

# Question model
class Question(ObjectIdModel):
    question: str
    options: List[str]
    correct_answer: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str_objectid
        }

class Answer(BaseModel):
    questionId: ObjectId  # Use ObjectId for questionId
    selectedAnswer: str
    is_correct: bool

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str_objectid
        }

# UserQuizSubmission model
class UserQuizSubmission(BaseModel):
    user_id: str
    answers: List[Answer]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str_objectid
        }
