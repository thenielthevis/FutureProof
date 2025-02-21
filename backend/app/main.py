from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import smtplib
from app.config import get_database, print_mongo_connection_info
from app.routes import user_routes, prediction_routes, avatar_routes, daily_reward_routes, health_quiz_routes, meditation_breathing_routes
from app.services.user_service import register_user, verify_user_otp
from app.models.user_model import UserCreate

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

# Define request model for email
class EmailRequest(BaseModel):
    to_email: str
    subject: str
    message: str

# Mailtrap SMTP Credentials
MAILTRAP_HOST = "smtp.mailtrap.io"
MAILTRAP_PORT = 2525
MAILTRAP_USERNAME = "3e5da143b7a5f6"
MAILTRAP_PASSWORD = "4e0634ed53aaf2"
SENDER_EMAIL = "your_email@example.com"

@app.post("/send-email/")
def send_email(email_data: EmailRequest):
    try:
        with smtplib.SMTP(MAILTRAP_HOST, MAILTRAP_PORT) as server:
            server.starttls()
            server.login(MAILTRAP_USERNAME, MAILTRAP_PASSWORD)

            email_text = f"""\ 
From: {SENDER_EMAIL}
To: {email_data.to_email}
Subject: {email_data.subject}

{email_data.message}
"""
            server.sendmail(SENDER_EMAIL, email_data.to_email, email_text)
        
        return {"message": "Email sent successfully!"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint for user registration
@app.post("/register/")
async def register(user: UserCreate):
    registered_user = await register_user(user)
    if not registered_user:
        raise HTTPException(status_code=400, detail="User already exists")
    return {"message": "User registered successfully. Please check your email for the OTP."}

# Endpoint for OTP verification
class OTPVerificationRequest(BaseModel):
    email: str
    otp: str

@app.post("/verify-otp/")
async def verify_otp(request: OTPVerificationRequest):
    result = await verify_user_otp(request.email, request.otp)
    return result

# Include routers
app.include_router(user_routes.router)
app.include_router(prediction_routes.router)
app.include_router(avatar_routes.router)
app.include_router(daily_reward_routes.router)
app.include_router(health_quiz_routes.router)
app.include_router(meditation_breathing_routes.router)

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