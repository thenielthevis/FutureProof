import cloudinary.uploader
from bson import ObjectId
from fastapi import HTTPException, UploadFile, Form, File
from typing import Optional
from app.models.physical_activity_model import PhysicalActivity
from app.config import get_database

db = get_database()

async def create_physical_activity(
    activity_name: str = Form(...),
    activity_type: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    instructions: Optional[list[str]] = Form(None),
    repetition: Optional[int] = Form(None),
    timer: Optional[int] = Form(None)
) -> PhysicalActivity:
    try:
        # Log received values for debugging
        print(f"Received activity_name: {activity_name}")
        print(f"Received activity_type: {activity_type}")
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

        # Create physical_activity object
        physical_activity = PhysicalActivity(
            activity_name=activity_name,
            activity_type=activity_type,
            description=description,
            url=result["secure_url"],
            public_id=result["public_id"],
            instructions=instructions,
            repetition=repetition,
            timer=timer
        )

        # Save physical_activity to database
        await db.physical_activity.insert_one(physical_activity.dict())

        return physical_activity

    except Exception as e:
        print(f"Error creating physical_activity: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def read_physical_activity() -> list[PhysicalActivity]:
    try:
        physical_activity = await db.physical_activity.find().to_list(length=None)
        return [PhysicalActivity(**item) for item in physical_activity]
    except Exception as e:
        print(f"Error reading physical_activity: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def read_physical_activity_by_id(item_id: str) -> PhysicalActivity:
    try:
        item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return PhysicalActivity(**item)
    except Exception as e:
        print(f"Error reading physical_activity by ID: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def update_physical_activity(item_id: str, activity_name: Optional[str], activity_type: Optional[str], description: Optional[str], file: Optional[UploadFile], instructions: Optional[list[str]], repetition: Optional[int], timer: Optional[int]) -> PhysicalActivity:
    try:
        # Fetch the existing item from the database
        item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        update_data = {}
        if activity_name is not None:
            update_data["activity_name"] = activity_name
        if activity_type is not None:
            update_data["activity_type"] = activity_type
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
        if repetition is not None:
            update_data["repetition"] = repetition
        if timer is not None:
            update_data["timer"] = timer

        # Update the item in the database
        await db.physical_activity.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
        updated_item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        return PhysicalActivity(**updated_item)
    except Exception as e:
        print(f"Error updating physical_activity: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def delete_physical_activity(item_id: str) -> PhysicalActivity:
    try:
        # Fetch the existing item from the database
        item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # Delete the item from Cloudinary
        cloudinary.uploader.destroy(item['public_id'])

        # Delete the item from the database
        await db.physical_activity.delete_one({"_id": ObjectId(item_id)})
        return PhysicalActivity(**item)
    except Exception as e:
        print(f"Error deleting physical_activity: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
