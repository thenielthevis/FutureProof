import cloudinary.uploader
from bson import ObjectId
from fastapi import HTTPException, UploadFile
from typing import Optional
from app.models.avatar_model import Avatar
from app.config import get_database

db = get_database()

async def create_avatar(name: str, description: str, file: UploadFile) -> Avatar:
    try:
        result = cloudinary.uploader.upload(file.file)
        avatar = Avatar(
            name=name,
            description=description,
            url=result['secure_url'],
            public_id=result['public_id']
        )
        # Save avatar to the database
        await db.avatars.insert_one(avatar.dict())
        return avatar
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def read_avatars() -> list[Avatar]:
    avatars = await db.avatars.find().to_list(length=None)
    return [Avatar(**avatar) for avatar in avatars]

async def read_avatar_by_id(avatar_id: str) -> Avatar:
    avatar = await db.avatars.find_one({"_id": ObjectId(avatar_id)})
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return Avatar(**avatar)

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
        raise HTTPException(status_code=400, detail=str(e))
