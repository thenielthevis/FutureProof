import cloudinary.uploader
from bson import ObjectId
from fastapi import HTTPException, UploadFile, Form, File, status
from typing import Optional, List
from app.models.physical_activity_model import PhysicalActivity
from app.config import get_database
from app.models.user_model import UserInDB
import json  # Add this at the top with other imports

db = get_database()

async def create_physical_activity(
    activity_name: str = Form(...),
    activity_type: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    instructions: Optional[str] = Form(None),  # Receives JSON string
    repetition: Optional[int] = Form(None),
    timer: Optional[int] = Form(None),
) -> PhysicalActivity:
    try:
        # Parse instructions from JSON string
        instructions_list = json.loads(instructions) if instructions else []

        print(f"Parsed instructions: {instructions_list}")  # Debug log

        # Log received values for debugging
        print(f"Received data: name={activity_name}, type={activity_type}, file={file.filename}")

        # Validate file presence
        if not file or not file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                              detail="No file uploaded or invalid file format")

        # Upload file to Cloudinary
        result = cloudinary.uploader.upload(file.file, resource_type="video")
        print(f"Cloudinary upload result: {result}")

        # Create physical_activity object with Cloudinary data
        physical_activity = PhysicalActivity(
            activity_name=activity_name,
            activity_type=activity_type,
            description=description,
            url=result["secure_url"],
            public_id=result["public_id"],
            instructions=instructions_list,  # Use the properly parsed list
            repetition=repetition,
            timer=timer,
        )

        # Save to database
        await db.physical_activity.insert_one(physical_activity.dict())
        return physical_activity

    except Exception as e:
        print(f"Error creating physical_activity: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                          detail=str(e))

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
    file: Optional[UploadFile] = None,
    instructions: Optional[str] = Form(None),  # Receives JSON string
    repetition: Optional[int] = None,
    timer: Optional[int] = None,
    current_user: UserInDB = None,
) -> PhysicalActivity:
    try:
        if not current_user or current_user.role not in ["admin", "trainer"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update physical activities"
            )

        # Verify item exists
        existing_item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Physical activity not found"
            )

        # Prepare update data
        update_data = {}
        if activity_name is not None:
            update_data["activity_name"] = activity_name
        if activity_type is not None:
            update_data["activity_type"] = activity_type
        if description is not None:
            update_data["description"] = description
            
        # Parse instructions from JSON string
        if instructions is not None:
            instructions_list = json.loads(instructions)
            update_data["instructions"] = instructions_list

        if repetition is not None:
            update_data["repetition"] = repetition
        if timer is not None:
            update_data["timer"] = timer

        # Handle file upload if provided
        if file and file.filename:
            try:
                # Delete old video from Cloudinary
                if existing_item.get("public_id"):
                    cloudinary.uploader.destroy(existing_item["public_id"])
                
                # Upload new video
                result = cloudinary.uploader.upload(file.file, resource_type="video")
                update_data["url"] = result["secure_url"]
                update_data["public_id"] = result["public_id"]
            except Exception as e:
                print(f"Error handling file upload: {e}")
                raise HTTPException(status_code=500, detail="Error processing video file")

        # Update database
        result = await db.physical_activity.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_data}
        )

        if result.modified_count == 0 and len(update_data) > 0:
            raise HTTPException(status_code=400, detail="No changes made")

        updated_item = await db.physical_activity.find_one({"_id": ObjectId(item_id)})
        return PhysicalActivity(**updated_item)

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in update_physical_activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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