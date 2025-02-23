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

# Asset model
class Asset(ObjectIdModel):
    name: str
    description: str
    url: str  # URL for the 3D GLB model
    image_url: str  # URL for the image preview
    public_id: str
    price: float
    asset_type: str

    class Config:
        json_encoders = {
            ObjectId: str_objectid
        }
        arbitrary_types_allowed = True
