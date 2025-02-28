from bson import ObjectId
from fastapi import HTTPException
from app.models.owned_asset_model import OwnedAsset
from app.config import get_database

db = get_database()

async def add_owned_asset(user_id: ObjectId, asset_id: str):
    try:
        owned_asset = await db.owned_assets.find_one({"user_id": user_id})
        if owned_asset:
            await db.owned_assets.update_one(
                {"user_id": user_id},
                {"$addToSet": {"asset_ids": asset_id}}
            )
        else:
            new_owned_asset = OwnedAsset(user_id=user_id, asset_ids=[asset_id])
            await db.owned_assets.insert_one(new_owned_asset.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def get_owned_assets(user_id: ObjectId) -> OwnedAsset:
    try:
        owned_asset = await db.owned_assets.find_one({"user_id": user_id})
        if not owned_asset:
            raise HTTPException(status_code=404, detail="No owned assets found for this user")
        return OwnedAsset(**owned_asset)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
