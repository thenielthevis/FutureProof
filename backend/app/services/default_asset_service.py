from bson import ObjectId
from fastapi import HTTPException
from app.models.default_asset_model import DefaultAsset, EquippedAsset
from app.config import get_database

db = get_database()

async def equip_asset(user_id: ObjectId, asset_type: str, asset_id: str):
    try:
        default_asset = await db.default_assets.find_one({"user_id": user_id})
        if default_asset:
            await db.default_assets.update_one(
                {"user_id": user_id},
                {"$set": {f"equipped_assets.{asset_type}": asset_id}}
            )
        else:
            new_default_asset = DefaultAsset(user_id=user_id, equipped_assets={asset_type: asset_id})
            await db.default_assets.insert_one(new_default_asset.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def get_equipped_assets(user_id: ObjectId) -> DefaultAsset:
    try:
        default_asset = await db.default_assets.find_one({"user_id": user_id})
        if not default_asset:
            raise HTTPException(status_code=404, detail="No equipped assets found for this user")
        
        # Fetch asset details for equipped assets
        equipped_assets = {}
        for asset_type, asset_id in default_asset["equipped_assets"].items():
            asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
            if asset:
                equipped_assets[asset_type] = EquippedAsset(asset_id=asset_id, url=asset["url"])
        
        return DefaultAsset(user_id=user_id, equipped_assets=equipped_assets)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def unequip_asset(user_id: ObjectId, asset_type: str):
    try:
        default_asset = await db.default_assets.find_one({"user_id": user_id})
        if default_asset and asset_type in default_asset["equipped_assets"]:
            await db.default_assets.update_one(
                {"user_id": user_id},
                {"$unset": {f"equipped_assets.{asset_type}": ""}}
            )
        else:
            raise HTTPException(status_code=404, detail="Equipped asset not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
