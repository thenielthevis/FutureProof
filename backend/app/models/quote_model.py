from pydantic import BaseModel, Field, field_validator
from bson import ObjectId
from typing import Optional
from datetime import datetime

# Function to convert ObjectId to string
def str_objectid(id: ObjectId) -> str:
    return str(id)

# Custom Pydantic model for ObjectId
class ObjectIdModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")

    @field_validator("id", mode="before")
    @classmethod
    def validate_objectid(cls, value):
        if isinstance(value, ObjectId):
            return str(value)  # Convert ObjectId to string
        return value

# Quote model
class Quote(ObjectIdModel):
    text: str
    author: Optional[str] = None
    date_added: datetime = Field(default_factory=datetime.utcnow)