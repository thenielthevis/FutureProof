import cloudinary.uploader
from bson import ObjectId
from fastapi import HTTPException, UploadFile, Form, File, status
from typing import Optional, List
from app.models.physical_activity_model import PhysicalActivity
from app.config import get_database

db = get_database()

async def create_physical_activity(
    activity_name: str = Form(...),
    activity_type: str = Form(...),
    description: str = Form(...),
    url: str = Form(...),
    public_id: str = Form(...),
    file: UploadFile = File(...),
    instructions: Optional[List[str]] = Form(None),
    repetition: Optional[int] = Form(None),
    timer: Optional[int] = Form(None),
) -> PhysicalActivity:
    try:
        # Log received values for debugging
        print(f"Received activity_name: {activity_name}")
        print(f"Received activity_type: {activity_type}")
        print(f"Received description: {description}")
        print(f"Received url: {url}")
        print(f"Received public_id: {public_id}")
        print(f"Received file: {file.filename}, ContentType: {file.content_type}")

        # Validate file presence
        if not file or not file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded or invalid file format")

        # Upload file to Cloudinary directly from UploadFile stream
        result = cloudinary.uploader.upload(file.file, resource_type="video")

        # Log Cloudinary response
        print(f"Cloudinary upload result: {result}")

        # Create physical_activity object
        physical_activity = PhysicalActivity(
            activity_name=activity_name,
            activity_type=activity_type,
            description=description,
            url=result["secure_url"],  # Use Cloudinary URL
            public_id=result["public_id"],  # Use Cloudinary public_id
            instructions=instructions,
            repetition=repetition,
            timer=timer,
        )

        # Save physical_activity to database
        await db.physical_activity.insert_one(physical_activity.dict())

        return physical_activity

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error creating physical_activity: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

async def read_physical_activity() -> List[PhysicalActivity]:
    try:
        physical_activities = await db.physical_activity.find().to_list(length=None)
        return [PhysicalActivity(**item) for item in physical_activities]
    except Exception as e:
        print(f"Error reading physical_activities: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

async def read_physical_activity_by_id(item_id: str) -> PhysicalActivity:
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ObjectId format")

        item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        return PhysicalActivity(**item)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error reading physical_activity by ID: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

async def update_physical_activity(
    item_id: str,
    activity_name: Optional[str] = None,
    activity_type: Optional[str] = None,
    description: Optional[str] = None,
    url: Optional[str] = None,
    public_id: Optional[str] = None,
    file: Optional[UploadFile] = None,
    instructions: Optional[List[str]] = None,
    repetition: Optional[int] = None,
    timer: Optional[int] = None,
) -> PhysicalActivity:
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ObjectId format")

        # Fetch the existing item from the database
        item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        update_data = {}
        if activity_name is not None:
            update_data["activity_name"] = activity_name
        if activity_type is not None:
            update_data["activity_type"] = activity_type
        if description is not None:
            update_data["description"] = description
        if url is not None:
            update_data["url"] = url
        if public_id is not None:
            update_data["public_id"] = public_id
        if file is not None:
            # Delete the old file from Cloudinary
            cloudinary.uploader.destroy(item["public_id"])
            # Upload the new file to Cloudinary
            result = cloudinary.uploader.upload(file.file, resource_type="video")
            update_data["url"] = result["secure_url"]
            update_data["public_id"] = result["public_id"]
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
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error updating physical_activity: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

async def delete_physical_activity(item_id: str) -> PhysicalActivity:
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ObjectId format")

        # Fetch the existing item from the database
        item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        # Delete the file from Cloudinary
        cloudinary.uploader.destroy(item["public_id"])

        # Delete the item from the database
        await db.physical_activity.delete_one({"_id": ObjectId(item_id)})
        return PhysicalActivity(**item)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error deleting physical_activity: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")