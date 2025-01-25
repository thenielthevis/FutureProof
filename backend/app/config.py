from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlparse

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
