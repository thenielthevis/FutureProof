from app.models.user_model import UserInDB
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI is not set in environment variables")

# Initialize MongoDB client
mongo_client = AsyncIOMotorClient(MONGO_URI)

db = mongo_client.FutureProof

async def get_user_by_email(email: str) -> UserInDB:
    user_data = await db.users.find_one({"email": email})
    if user_data:
        return UserInDB(**user_data)
    return None