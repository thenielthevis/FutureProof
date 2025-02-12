from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_database, print_mongo_connection_info
from app.routes import user_routes, prediction_routes, avatar_routes

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:8081",  # React Native / Expo
    "http://127.0.0.1:8000",  # Backend itself (for local testing)
    "http://localhost",       # Localhost for web testing
    "http://172.34.6.61:8000", # Your machine's IP
    "http://10.0.2.2:8000",   # Android emulator accessing backend
    "http://172.34.6.61:8081",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

app.include_router(user_routes.router)
app.include_router(prediction_routes.router)
app.include_router(avatar_routes.router)

# MongoDB connection setup at startup
@app.on_event("startup")
async def startup_db():
    try:
        # Print MongoDB connection info
        print_mongo_connection_info()

        # Test MongoDB connection
        db = get_database()
        await db.command("ping")
        print("MongoDB connection is healthy.")
    except Exception as e:
        print(f"Error connecting to database: {e}")

@app.get("/")
async def root():
    return {"message": "Welcome to FutureProof Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
