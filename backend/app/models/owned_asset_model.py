from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional, List

# Convert ObjectId to string for serialization
def str_objectid(id: ObjectId) -> str:
    return str(id)

# Custom Pydantic model for ObjectId
class ObjectIdModel(BaseModel):
    id: Optional[ObjectId] = Field(default=None, alias="_id")

    class Config:
        arbitrary_types_allowed = True

# OwnedAsset model
class OwnedAsset(ObjectIdModel):
    user_id: ObjectId
    asset_ids: List[ObjectId]

    class Config:
        json_encoders = {
            ObjectId: str_objectid
        }
        arbitrary_types_allowed = True
