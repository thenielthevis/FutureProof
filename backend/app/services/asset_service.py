import cloudinary.uploader
from bson import ObjectId
from fastapi import HTTPException, UploadFile, Form, File
from typing import Optional
from app.models.asset_model import Asset
from app.config import get_database

db = get_database()

async def create_asset(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),  # GLB file
    image_file: UploadFile = File(...),  # Image file
    price: float = Form(...),
    asset_type: str = Form(...)
) -> Asset:
    try:
        # Log received values for debugging
        print(f"Received name: {name}")  
        print(f"Received description: {description}")  
        print(f"Received file: {file.filename}, ContentType: {file.content_type}")  
        print(f"Received image_file: {image_file.filename}, ContentType: {image_file.content_type}")  
        print(f"Received price: {price}")
        print(f"Received asset_type: {asset_type}")

        # Validate file presence
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No GLB file uploaded or invalid file format")
        if not image_file or not image_file.filename:
            raise HTTPException(status_code=400, detail="No image file uploaded or invalid file format")

        # Log file details before upload
        print(f"Uploading GLB file: {file.filename}, ContentType: {file.content_type}")
        print(f"Uploading image file: {image_file.filename}, ContentType: {image_file.content_type}")

        # Upload files to Cloudinary directly from UploadFile stream
        glb_result = cloudinary.uploader.upload(file.file, resource_type="raw")
        image_result = cloudinary.uploader.upload(image_file.file, resource_type="image")

        # Log Cloudinary response
        print(f"Cloudinary GLB upload result: {glb_result}")
        print(f"Cloudinary image upload result: {image_result}")

        # Create asset object
        asset = Asset(
            name=name,
            description=description,
            url=glb_result["secure_url"],  # GLB file URL
            image_url=image_result["secure_url"],  # Image file URL
            public_id=glb_result["public_id"],
            price=price,
            asset_type=asset_type
        )
        

        # Save asset to database
        await db.assets.insert_one(asset.dict())

        return asset

    except Exception as e:
        print(f"Error creating asset: {str(e)}")  
        raise HTTPException(status_code=400, detail=str(e))

async def read_assets() -> list[Asset]:
    try:
        assets = await db.assets.find().to_list(length=None)
        assetArray = [Asset(**asset) for asset in assets]
        return assetArray
    except Exception as e:
        print(f"Error reading assets: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def read_asset_by_id(asset_id: str) -> Asset:
    try:
        asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        return Asset(**asset)
    except Exception as e:
        print(f"Error reading asset by ID: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def update_asset(asset_id: str, name: Optional[str], description: Optional[str], file: Optional[UploadFile], price: Optional[float], asset_type: Optional[str]) -> Asset:
    try:
        # Fetch the existing asset from the database
        asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if price is not None:
            update_data["price"] = price
        if asset_type is not None:
            update_data["asset_type"] = asset_type
        if file is not None:
            # Delete the old asset from Cloudinary
            cloudinary.uploader.destroy(asset['public_id'])
            # Upload the new asset to Cloudinary
            result = cloudinary.uploader.upload(file.file)
            update_data["url"] = result['secure_url']
            update_data["public_id"] = result['public_id']

        # Update the asset in the database
        await db.assets.update_one({"_id": ObjectId(asset_id)}, {"$set": update_data})
        updated_asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
        return Asset(**updated_asset)
    except Exception as e:
        print(f"Error updating asset: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def delete_asset(asset_id: str) -> Asset:
    try:
        # Fetch the existing asset from the database
        asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        # Delete the asset from Cloudinary
        cloudinary.uploader.destroy(asset['public_id'])

        # Delete the asset from the database
        await db.assets.delete_one({"_id": ObjectId(asset_id)})
        return Asset(**asset)
    except Exception as e:
        print(f"Error deleting asset: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))
