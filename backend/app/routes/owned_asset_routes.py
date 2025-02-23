from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from app.models.owned_asset_model import OwnedAsset
from app.models.user_model import UserInDB
from app.dependencies import get_current_user
from app.services.owned_asset_service import create_owned_asset, read_owned_assets, delete_owned_asset, buy_asset

router = APIRouter()

# Create an owned asset
@router.post("/create/owned_asset/", response_model=OwnedAsset)
async def create_owned_asset_route(
    user_id: ObjectId,
    asset_ids: List[ObjectId],
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        return await create_owned_asset(user_id, asset_ids)
    except HTTPException as e:
        print(f"Error creating owned asset: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error creating owned asset: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read owned assets
@router.get("/owned_assets/{user_id}", response_model=List[OwnedAsset])
async def read_owned_assets_route(user_id: ObjectId):
    try:
        return await read_owned_assets(user_id)
    except Exception as e:
        print(f"Error reading owned assets: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read all owned assets
@router.get("/owned_assets/", response_model=List[OwnedAsset])
async def read_all_owned_assets_route():
    try:
        owned_assets = await read_owned_assets()
        return owned_assets
    except Exception as e:
        print(f"Error reading all owned assets: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Delete an owned asset
@router.delete("/delete/owned_asset/{owned_asset_id}", response_model=OwnedAsset)
async def delete_owned_asset_route(owned_asset_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        return await delete_owned_asset(owned_asset_id)
    except Exception as e:
        print(f"Error deleting owned asset: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Buy an asset
@router.post("/buy_asset")
async def buy_asset_route(
    asset_url: str,
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        return await buy_asset(current_user.id, asset_url)
    except HTTPException as e:
        print(f"Error buying asset: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error buying asset: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
