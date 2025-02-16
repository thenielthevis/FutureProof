import cloudinary.uploader
from bson import ObjectId
from fastapi import HTTPException, UploadFile, Form, File
from typing import Optional
from app.models.avatar_model import Avatar
from app.models.user_model import UserInDB
from app.config import get_database

db = get_database()

async def create_avatar(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
) -> Avatar:
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
        result = cloudinary.uploader.upload(file.file, resource_type="image")

        # Log Cloudinary response
        print(f"Cloudinary upload result: {result}")

        # Create avatar object
        avatar = Avatar(
            name=name,
            description=description,
            url=result["secure_url"],
            public_id=result["public_id"],
        )

        # Save avatar to database
        await db.avatars.insert_one(avatar.dict())

        return avatar

    except Exception as e:
        print(f"Error creating avatar: {str(e)}")  
        raise HTTPException(status_code=400, detail=str(e))

async def read_avatars() -> list[Avatar]:
    try:
        avatars = await db.avatars.find().to_list(length=None)
        return [Avatar(**avatar) for avatar in avatars]
    except Exception as e:
        print(f"Error reading avatars: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def read_avatar_by_id(avatar_id: str) -> Avatar:
    try:
        avatar = await db.avatars.find_one({"_id": ObjectId(avatar_id)})
        if not avatar:
            raise HTTPException(status_code=404, detail="Avatar not found")
        return Avatar(**avatar)
    except Exception as e:
        print(f"Error reading avatar by ID: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def update_avatar(avatar_id: str, name: Optional[str], description: Optional[str], file: Optional[UploadFile]) -> Avatar:
    try:
        # Fetch the existing avatar from the database
        avatar = await db.avatars.find_one({"_id": ObjectId(avatar_id)})
        if not avatar:
            raise HTTPException(status_code=404, detail="Avatar not found")

        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if file is not None:
            # Delete the old avatar from Cloudinary
            cloudinary.uploader.destroy(avatar['public_id'])
            # Upload the new avatar to Cloudinary
            result = cloudinary.uploader.upload(file.file)
            update_data["url"] = result['secure_url']
            update_data["public_id"] = result['public_id']

        # Update the avatar in the database
        await db.avatars.update_one({"_id": ObjectId(avatar_id)}, {"$set": update_data})
        updated_avatar = await db.avatars.find_one({"_id": ObjectId(avatar_id)})
        return Avatar(**updated_avatar)
    except Exception as e:
        print(f"Error updating avatar: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def delete_avatar(avatar_id: str) -> Avatar:
    try:
        # Fetch the existing avatar from the database
        avatar = await db.avatars.find_one({"_id": ObjectId(avatar_id)})
        if not avatar:
            raise HTTPException(status_code=404, detail="Avatar not found")

        # Delete the avatar from Cloudinary
        cloudinary.uploader.destroy(avatar['public_id'])

        # Delete the avatar from the database
        await db.avatars.delete_one({"_id": ObjectId(avatar_id)})
        return Avatar(**avatar)
    except Exception as e:
        print(f"Error deleting avatar: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def claim_avatar(avatar_id: str, current_user: UserInDB) -> Avatar:
    try:
        avatar = await db.avatars.find_one({"_id": ObjectId(avatar_id)})
        if not avatar:
            raise HTTPException(status_code=404, detail="Avatar not found")

        avatar_id_obj = ObjectId(avatar_id)
        if avatar_id_obj not in current_user.avatars:
            current_user.avatars.append(avatar_id_obj)
            await db.users.update_one({"_id": current_user.id}, {"$set": {"avatars": current_user.avatars}})
        
        return Avatar(**avatar)
    except Exception as e:
        print(f"Error claiming avatar: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))

async def get_avatar_icon(avatar_name: str) -> Avatar:
    try:
        avatar = await db.avatars.find_one({"name": avatar_name})
        if not avatar:
            raise HTTPException(status_code=404, detail="Avatar not found")
        return Avatar(**avatar)
    except Exception as e:
        print(f"Error getting avatar icon: {str(e)}")  # Log error
        raise HTTPException(status_code=400, detail=str(e))
