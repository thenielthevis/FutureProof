import cloudinary.uploader
from bson import ObjectId
from fastapi import HTTPException, UploadFile, Form, File, status
from typing import Optional, List
from app.models.meditation_breathing_model import MeditationBreathing
from app.config import get_database
import json  # Add this at the top with other imports
import logging
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = get_database()

async def create_meditation_breathing(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    instructions: Optional[str] = Form(None),  # Receives JSON string
) -> MeditationBreathing:
    try:
        # Parse instructions from JSON string
        instructions_list = json.loads(instructions) if instructions else []

        print(f"Parsed instructions: {instructions_list}")  # Debug log

        # Log received values for debugging
        logger.info(f"Creating meditation/breathing item: Name={name}, Description={description}")

        # Validate file presence
        if not file or not file.filename:
            logger.error("No file uploaded or invalid file format")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded or invalid file format")

        # Log file details before upload
        logger.info(f"Uploading file: {file.filename}, ContentType: {file.content_type}")

        # Upload file to Cloudinary directly from UploadFile stream
        result = cloudinary.uploader.upload(file.file, resource_type="video")

        # Log Cloudinary response
        logger.info(f"Cloudinary upload result: {result}")

        # Create meditation_breathing object
        meditation_breathing = MeditationBreathing(
            name=name,
            description=description,
            url=result["secure_url"],
            public_id=result["public_id"],
            instructions=instructions_list,  # Use the properly parsed list
        )

        # Save meditation_breathing to database
        await db.meditation_breathing.insert_one(meditation_breathing.dict())

        logger.info(f"Meditation/breathing item created successfully: {meditation_breathing}")
        return meditation_breathing

    except HTTPException as e:
        logger.error(f"HTTP error creating meditation/breathing item: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error creating meditation/breathing item: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

async def read_meditation_breathing() -> List[MeditationBreathing]:
    try:
        logger.info("Fetching all meditation/breathing items")
        meditation_breathing = await db.meditation_breathing.find().to_list(length=None)
        return [MeditationBreathing(**item) for item in meditation_breathing]
    except Exception as e:
        logger.error(f"Error reading meditation/breathing items: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

async def read_meditation_breathing_by_id(item_id: str) -> MeditationBreathing:
    try:
        logger.info(f"Fetching meditation/breathing item with ID: {item_id}")
        item = await db.meditation_breathing.find_one({"_id": ObjectId(item_id)})
        if not item:
            logger.error(f"Item not found with ID: {item_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
        return MeditationBreathing(**item)
    except HTTPException as e:
        logger.error(f"HTTP error fetching meditation/breathing item: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error fetching meditation/breathing item: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

async def update_meditation_breathing(
    item_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    file: Optional[UploadFile] = None,
    instructions: Optional[str] = Form(None),  # Receives JSON string
) -> MeditationBreathing:
    try:
        logger.info(f"Updating meditation/breathing item with ID: {item_id}")

        # Fetch the existing item from the database
        item = await db.meditation_breathing.find_one({"_id": ObjectId(item_id)})
        if not item:
            logger.error(f"Item not found with ID: {item_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if instructions is not None:
            instructions_list = json.loads(instructions)
            update_data["instructions"] = instructions_list
        if file is not None:
            # Delete the old item from Cloudinary
            cloudinary.uploader.destroy(item["public_id"])
            # Upload the new item to Cloudinary
            result = cloudinary.uploader.upload(file.file, resource_type="video")
            update_data["url"] = result["secure_url"]
            update_data["public_id"] = result["public_id"]

        # Update the item in the database
        await db.meditation_breathing.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
        updated_item = await db.meditation_breathing.find_one({"_id": ObjectId(item_id)})
        logger.info(f"Meditation/breathing item updated successfully: {updated_item}")
        return MeditationBreathing(**updated_item)
    except HTTPException as e:
        logger.error(f"HTTP error updating meditation/breathing item: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error updating meditation/breathing item: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

async def delete_meditation_breathing(item_id: str) -> MeditationBreathing:
    try:
        logger.info(f"Deleting meditation/breathing item with ID: {item_id}")

        # Fetch the existing item from the database
        item = await db.meditation_breathing.find_one({"_id": ObjectId(item_id)})
        if not item:
            logger.error(f"Item not found with ID: {item_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        # Delete the item from Cloudinary
        cloudinary.uploader.destroy(item["public_id"])

        # Delete the item from the database
        await db.meditation_breathing.delete_one({"_id": ObjectId(item_id)})
        logger.info(f"Meditation/breathing item deleted successfully: {item}")
        return MeditationBreathing(**item)
    except HTTPException as e:
        logger.error(f"HTTP error deleting meditation/breathing item: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error deleting meditation/breathing item: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")