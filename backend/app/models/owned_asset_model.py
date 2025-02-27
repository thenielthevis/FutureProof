from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Optional

class OwnedAsset(BaseModel):
    user_id: ObjectId
    asset_ids: Optional[List[str]] = []

    class Config:
        json_encoders = {
            ObjectId: str
        }
        arbitrary_types_allowed = True
