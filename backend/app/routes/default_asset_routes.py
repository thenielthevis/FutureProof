from fastapi import APIRouter, Depends, HTTPException, Body
from bson import ObjectId
from app.models.default_asset_model import DefaultAsset
from app.models.user_model import UserInDB
from app.dependencies import get_current_user
from app.services.default_asset_service import equip_asset, get_equipped_assets
from pydantic import BaseModel

router = APIRouter()

class EquipAssetRequest(BaseModel):
    asset_type: str
    asset_id: str

@router.post("/equip_asset/")
async def equip_asset_route(request: EquipAssetRequest, current_user: UserInDB = Depends(get_current_user)):
    try:
        await equip_asset(current_user.id, request.asset_type, request.asset_id)
        return {"message": "Asset equipped successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/equipped_assets/", response_model=DefaultAsset)
async def get_equipped_assets_route(current_user: UserInDB = Depends(get_current_user)):
    try:
        return await get_equipped_assets(current_user.id)
    except HTTPException as e:
        raise e
