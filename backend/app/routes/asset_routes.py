from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.models.asset_model import Asset
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin
from app.services.asset_service import create_asset, read_assets, read_asset_by_id, update_asset, delete_asset
from app.services.owned_asset_service import buy_asset

router = APIRouter()

class AssetCreate(BaseModel):
    name: str
    description: str
    price: float
    asset_type: str

# Create an asset
@router.post("/create/asset/", response_model=Asset)
async def create_asset_route(
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    image_file: UploadFile = File(...),
    price: float = Form(...),
    asset_type: str = Form(...),
    current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        # Log the received data for debugging
        print(f"Received data - Name: {name}, Description: {description}, File: {file.filename}, ContentType: {file.content_type}, Image File: {image_file.filename}, ContentType: {image_file.content_type}, Price: {price}, Asset Type: {asset_type}")
        return await create_asset(name, description, file, image_file, price, asset_type)
    except HTTPException as e:
        print(f"Error creating asset: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error creating asset: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read assets
@router.get("/assets/", response_model=List[Asset])
async def read_assets_route():
    try:
        return await read_assets()
    except Exception as e:
        print(f"Error reading assets: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read a specific asset by ID
@router.get("/assets/{asset_id}", response_model=Asset)
async def read_asset_route(asset_id: str):
    try:
        return await read_asset_by_id(asset_id)
    except Exception as e:
        print(f"Error reading asset by ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    asset_type: Optional[str] = None

# Update an asset
@router.put("/update/asset/{asset_id}", response_model=Asset)
async def update_asset_route(
    asset_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    price: Optional[float] = Form(None),
    asset_type: Optional[str] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin)
):
    try:
        return await update_asset(asset_id, name, description, file, price, asset_type)
    except Exception as e:
        print(f"Error updating asset: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Delete an asset
@router.delete("/delete/asset/{asset_id}", response_model=Asset)
async def delete_asset_route(asset_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    try:
        return await delete_asset(asset_id)
    except Exception as e:
        print(f"Error deleting asset: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Buy an asset
# @router.post("/buy_asset")
# async def buy_asset_route(
#     asset_url: str,
#     current_user: UserInDB = Depends(get_current_user)
# ):
#     try:
#         return await buy_asset(current_user.id, asset_url)
#     except HTTPException as e:
#         print(f"Error buying asset: {e.detail}")
#         raise e
#     except Exception as e:
#         print(f"Unexpected error buying asset: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal Server Error")
