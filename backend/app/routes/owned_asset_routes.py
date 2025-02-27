from fastapi import APIRouter, Depends, HTTPException, Body
from bson import ObjectId
from app.models.owned_asset_model import OwnedAsset
from app.models.user_model import UserInDB
from app.dependencies import get_current_user
from app.services.owned_asset_service import add_owned_asset, get_owned_assets
from pydantic import BaseModel
from typing import List, Union

router = APIRouter()

class AddOwnedAssetRequest(BaseModel):
    asset_ids: Union[List[str], str]

@router.post("/owned_assets/")
async def add_owned_asset_route(request: AddOwnedAssetRequest, current_user: UserInDB = Depends(get_current_user)):
    try:
        asset_ids = request.asset_ids if isinstance(request.asset_ids, list) else [request.asset_ids]
        print(f"Received asset_ids: {asset_ids} for user: {current_user.id}")  # Log received data
        for asset_id in asset_ids:
            await add_owned_asset(current_user.id, asset_id)
        return {"message": "Assets added to owned assets"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/owned_assets/", response_model=OwnedAsset)
async def get_owned_assets_route(current_user: UserInDB = Depends(get_current_user)):
    try:
        return await get_owned_assets(current_user.id)
    except HTTPException as e:
        raise e
