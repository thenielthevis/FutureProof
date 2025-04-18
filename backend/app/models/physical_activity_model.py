from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional

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

# Physical Activity model
class PhysicalActivity(ObjectIdModel):
    activity_name: str
    activity_type: str
    description: str
    url: str
    public_id: str
    instructions: Optional[list[str]] = None
    repetition: Optional[int] = None
    timer: Optional[int] = None

    class Config:
        json_encoders = {
            ObjectId: str_objectid
        }
        arbitrary_types_allowed = True
