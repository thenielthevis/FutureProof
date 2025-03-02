from app.models.achievement_model import Achievement
from bson import ObjectId
from typing import Optional
from app.config import get_database

db = get_database()

async def create_achievement(data: dict) -> Achievement:
    """ Creates a new achievement in the database. """
    if "avatar_id" in data and data["avatar_id"]:  # Ensure avatar_id is a valid string
        data["avatar_id"] = str(data["avatar_id"])  # Convert ObjectId to string if needed

    # Generate a new ObjectId for the achievement
    data["_id"] = str(ObjectId())

    achievement = Achievement(**data)  # Validate with Pydantic
    await db["achievements"].insert_one(achievement.model_dump(by_alias=True))
    return achievement

async def get_achievements() -> list[Achievement]:
    """Fetches all achievements from the database."""
    achievements = await db["achievements"].find().to_list(1000)
    
    # Convert ObjectId to string before returning
    return [
        Achievement(**{
            **achievement, 
            "_id": str(achievement["_id"]),
            "avatar_id": str(achievement["avatar_id"]) if "avatar_id" in achievement and achievement["avatar_id"] else None
        }) 
        for achievement in achievements
    ]

async def get_achievement_by_id(id: str) -> Optional[Achievement]:
    """Fetches a single achievement by its ID."""
    try:
        achievement = await db["achievements"].find_one({"_id": ObjectId(id)})
        if achievement:
            # Convert ObjectId to string before returning
            achievement["_id"] = str(achievement["_id"])
            achievement["avatar_id"] = str(achievement["avatar_id"]) if "avatar_id" in achievement and achievement["avatar_id"] else None
            return Achievement(**achievement)
        return None
    except Exception:
        return None

async def update_achievement(id: str, data: dict) -> Optional[Achievement]:
    """Updates an existing achievement."""
    try:
        if data.get("avatar_id"):
            data["avatar_id"] = str(data["avatar_id"])  # Ensure avatar_id is a string
        else:
            data["avatar_id"] = None  # Ensure it's explicitly set to None

        print(f"Updating Achievement with ID: {id}")  # Debugging
        print(f"Data: {data}")  # Debugging

        result = await db["achievements"].update_one({"_id": ObjectId(id)}, {"$set": data})
        
        if result.matched_count == 0:
            return None  # No document was found

        # Fetch updated document
        updated_achievement = await get_achievement_by_id(id)
        if updated_achievement:
            updated_achievement.avatar_id = str(updated_achievement.avatar_id) if updated_achievement.avatar_id else None
        return updated_achievement
    except Exception as e:
        print(f"Error updating achievement: {e}")  # Debugging
        return None

async def delete_achievement(id: str) -> bool:
    """Deletes an achievement by its ID."""
    try:
        result = await db["achievements"].delete_one({"_id": ObjectId(id)})
        return result.deleted_count == 1
    except Exception:
        return False
