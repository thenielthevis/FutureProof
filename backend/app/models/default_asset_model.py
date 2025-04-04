from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Dict, Optional

class EquippedAsset(BaseModel):
    asset_id: str
    url: str
    color: Optional[str] = None  # Make color optional

class DefaultAsset(BaseModel):
    user_id: ObjectId
    equipped_assets: Dict[str, EquippedAsset]

    class Config:
        json_encoders = {
            ObjectId: str
        }
        arbitrary_types_allowed = True
