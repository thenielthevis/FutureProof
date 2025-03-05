from app.models.achievement_model import Achievement
from bson import ObjectId
from typing import Optional
from app.config import get_database

db = get_database()

async def create_achievement(data: dict) -> Achievement:
    """ Creates a new achievement in the database. """
    try:
        # Handle avatar_id
        if "avatar_id" in data and data["avatar_id"]:
            data["avatar_id"] = str(data["avatar_id"])

        # Create a new ObjectId and convert to string immediately
        new_id = str(ObjectId())

        # Create achievement document
        achievement_dict = {
            "_id": new_id,  # Store as string
            "name": data["name"],
            "description": data["description"],
            "coins": data.get("coins", 0),
            "xp": data.get("xp", 0),
            "requirements": data["requirements"],
            "avatar_id": data.get("avatar_id")
        }

        # Convert _id to ObjectId only for MongoDB insert
        mongo_dict = achievement_dict.copy()
        mongo_dict["_id"] = ObjectId(new_id)

        # Insert into database
        await db["achievements"].insert_one(mongo_dict)
        
        return Achievement(**achievement_dict)
    except Exception as e:
        print(f"Error creating achievement: {str(e)}")
        raise e

async def get_achievements() -> list[Achievement]:
    """Fetches all achievements from the database."""
    try:
        achievements = await db["achievements"].find().to_list(1000)
        
        # Convert ObjectId to string in results
        return [
            Achievement(**{
                **achievement, 
                "_id": str(achievement["_id"]),
                "avatar_id": str(achievement["avatar_id"]) if achievement.get("avatar_id") else None
            }) 
            for achievement in achievements
        ]
    except Exception as e:
        print(f"Error fetching achievements: {str(e)}")
        raise e

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
        # Convert string ID to ObjectId for MongoDB query
        object_id = ObjectId(id)
        
        # Clean the data before update
        update_data = {
            "name": data.get("name"),
            "description": data.get("description"),
            "coins": data.get("coins"),
            "xp": data.get("xp"),
            "requirements": data.get("requirements"),
            "avatar_id": str(data.get("avatar_id")) if data.get("avatar_id") else None
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        print(f"Updating achievement {id} with data:", update_data)  # Debug log

        result = await db["achievements"].update_one(
            {"_id": object_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            print(f"No achievement found with ID: {id}")  # Debug log
            return None

        # Fetch and return updated document
        updated_doc = await db["achievements"].find_one({"_id": object_id})
        if updated_doc:
            updated_doc["_id"] = str(updated_doc["_id"])  # Convert ObjectId to string
            return Achievement(**updated_doc)
        return None

    except Exception as e:
        print(f"Error in update_achievement service: {str(e)}")  # Debug log
        raise e

async def delete_achievement(id: str) -> bool:
    """Deletes an achievement by its ID."""
    try:
        # Convert string ID to ObjectId for MongoDB query
        object_id = ObjectId(id)
        
        print(f"Attempting to delete achievement with ID: {id}")  # Debug log
        
        result = await db["achievements"].delete_one({"_id": object_id})
        success = result.deleted_count > 0
        
        print(f"Delete result: {success}")  # Debug log
        
        return success
    except Exception as e:
        print(f"Error in delete_achievement service: {str(e)}")  # Debug log
        raise e
