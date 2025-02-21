import cloudinary.uploader
from bson import ObjectId
from fastapi import HTTPException, UploadFile, Form, File
from typing import Optional
from app.models.meditation_breathing_model import MeditationBreathing
from app.config import get_database

db = get_database()

async def create_meditation_breathing(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    instructions: Optional[list[str]] = Form(None)
) -> MeditationBreathing:
    try:
        # Log received values for debugging
        print(f"Received name: {name}")  
        print(f"Received description: {description}")  
        print(f"Received file: {file.filename}, ContentType: {file.content_type}")  

        # Validate file presence
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded or invalid file format")

        # Log file details before upload
        print(f"Uploading file: {file.filename}, ContentType: {file.content_type}")

        # Upload file to Cloudinary directly from UploadFile stream
        result = cloudinary.uploader.upload(file.file, resource_type="video")

        # Log Cloudinary response
        print(f"Cloudinary upload result: {result}")

        # Create meditation_breathing object
        meditation_breathing = MeditationBreathing(
            name=name,
            description=description,
            url=result["secure_url"],
            public_id=result["public_id"],
            instructions=instructions
        )

        # Save meditation_breathing to database
        await db.meditation_breathing.insert_one(meditation_breathing.dict())

        return meditation_breathing

    except Exception as e:
        print(f"Error creating meditation_breathing: {str(e)}")  
        raise HTTPException(status_code=400, detail=str(e))

async def read_meditation_breathing() -> list[MeditationBreathing]:
    try:
        meditation_breathing = await db.meditation_breathing.find().to_list(length=None)
        return [MeditationBreathing(**item) for item in meditation_breathing]
    except Exception as e:
        print(f"Error reading meditation_breathing: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def read_meditation_breathing_by_id(item_id: str) -> MeditationBreathing:
    try:
        item = await db.meditation_breathing.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return MeditationBreathing(**item)
    except Exception as e:
        print(f"Error reading meditation_breathing by ID: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def update_meditation_breathing(item_id: str, name: Optional[str], description: Optional[str], file: Optional[UploadFile], instructions: Optional[list[str]]) -> MeditationBreathing:
    try:
        # Fetch the existing item from the database
        item = await db.meditation_breathing.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if file is not None:
            # Delete the old item from Cloudinary
            cloudinary.uploader.destroy(item['public_id'])
            # Upload the new item to Cloudinary
            result = cloudinary.uploader.upload(file.file, resource_type="video")
            update_data["url"] = result['secure_url']
            update_data["public_id"] = result['public_id']
        if instructions is not None:
            update_data["instructions"] = instructions

        # Update the item in the database
        await db.meditation_breathing.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
        updated_item = await db.meditation_breathing.find_one({"_id": ObjectId(item_id)})
        return MeditationBreathing(**updated_item)
    except Exception as e:
        print(f"Error updating meditation_breathing: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def delete_meditation_breathing(item_id: str) -> MeditationBreathing:
    try:
        # Fetch the existing item from the database
        item = await db.meditation_breathing.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # Delete the item from Cloudinary
        cloudinary.uploader.destroy(item['public_id'])

        # Delete the item from the database
        await db.meditation_breathing.delete_one({"_id": ObjectId(item_id)})
        return MeditationBreathing(**item)
    except Exception as e:
        print(f"Error deleting meditation_breathing: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))