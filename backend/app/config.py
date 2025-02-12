from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlparse
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Load .env file
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI is not set in environment variables")

# Initialize MongoDB client
mongo_client = AsyncIOMotorClient(MONGO_URI)

def get_database():
    """
    Returns the connected MongoDB database instance.
    """
    return mongo_client.FutureProof

def print_mongo_connection_info():
    """
    Prints the MongoDB connection information for debugging purposes.
    """
    parsed_uri = urlparse(MONGO_URI)
    cluster_info = f"{parsed_uri.scheme}://{parsed_uri.hostname}"
    print(f"Connected to MongoDB cluster: {cluster_info}")

cloudinary.config(
  cloud_name = os.getenv("CLOUDINARY_NAME"),
  api_key = os.getenv("CLOUDINARY_API_KEY"),
  api_secret = os.getenv("CLOUDINARY_API_SECRET")
)

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM")

settings = Settings()