from bson import ObjectId
from fastapi import HTTPException
from typing import List
from app.models.owned_asset_model import OwnedAsset
from app.models.asset_model import Asset
from app.config import get_database

db = get_database()

async def create_owned_asset(user_id: ObjectId, asset_ids: List[ObjectId]) -> OwnedAsset:
    try:
        owned_asset = OwnedAsset(
            user_id=user_id,
            asset_ids=asset_ids
        )
        await db.owned_assets.insert_one(owned_asset.dict())
        return owned_asset
    except Exception as e:
        print(f"Error creating owned asset: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def read_owned_assets(user_id: ObjectId) -> List[OwnedAsset]:
    try:
        owned_assets = await db.owned_assets.find({"user_id": user_id}).to_list(length=None)
        return [OwnedAsset(**owned_asset) for owned_asset in owned_assets]
    except Exception as e:
        print(f"Error reading owned assets: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def delete_owned_asset(owned_asset_id: str) -> OwnedAsset:
    try:
        owned_asset = await db.owned_assets.find_one({"_id": ObjectId(owned_asset_id)})
        if not owned_asset:
            raise HTTPException(status_code=404, detail="Owned asset not found")
        await db.owned_assets.delete_one({"_id": ObjectId(owned_asset_id)})
        return OwnedAsset(**owned_asset)
    except Exception as e:
        print(f"Error deleting owned asset: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def buy_asset(user_id: ObjectId, asset_url: str) -> OwnedAsset:
    try:
        asset = await db.assets.find_one({"url": asset_url})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user["coins"] < asset["price"]:
            raise HTTPException(status_code=400, detail="Insufficient coins")

        # Deduct coins from user's balance
        new_coins = user["coins"] - asset["price"]
        await db.users.update_one({"_id": user_id}, {"$set": {"coins": new_coins}})

        owned_asset = await db.owned_assets.find_one({"user_id": user_id})
        if not owned_asset:
            owned_asset = OwnedAsset(user_id=user_id, asset_ids=[asset["_id"]])
            await db.owned_assets.insert_one(owned_asset.dict())
        else:
            owned_asset["asset_ids"].append(asset["_id"])
            await db.owned_assets.update_one(
                {"user_id": user_id},
                {"$set": {"asset_ids": owned_asset["asset_ids"]}}
            )

        return OwnedAsset(**owned_asset)
    except Exception as e:
        print(f"Error buying asset: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
