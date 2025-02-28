import os
import re
import requests
import httpx
from ..models.user_model import UserInDB
from ..models.prediction_model import PredictionInDB
from app.config import get_database
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables from .env file
load_dotenv()

# Load GroqCloud API key from environment variables
GROQCLOUD_API_KEY = os.getenv("GROQCLOUD_API_KEY")

# MongoDB setup
client = MongoClient(os.getenv("MONGODB_URI"))
db = get_database()
predictions_collection = db.get_collection("predictions")

def format_user_info(user: UserInDB) -> str:
    return (
        f"User Information:\n"
        f"Username: {user.username}\n"
        f"Email: {user.email}\n"
        f"Age: {user.age}\n"
        f"Gender: {user.gender}\n"
        f"Height: {user.height}\n"
        f"Weight: {user.weight}\n"
        f"Environment: {user.environment}\n"
        f"Vices: {', '.join(user.vices)}\n"
        f"Genetic Diseases: {', '.join(user.genetic_diseases)}\n"
        f"Lifestyle: {', '.join(user.lifestyle)}\n"
        f"Food Intake: {', '.join(user.food_intake)}\n"
        f"Sleep Hours: {user.sleep_hours}\n"
        f"Activeness: {user.activeness}\n"
        f"Please provide a structured response in Markdown format with the following sections:\n"
        f"### 1. Predicted Diseases with likelihood in percentage\n"
        f"### 2. Positive Habits\n"
        f"### 3. Areas for Improvement\n"
        f"### 4. Recommendations\n"
        f"Use bulleted lists for each section without usinng any bold text to condition name and details."
    )

async def predict_disease(user: UserInDB) -> dict:
    # Ensure the predictions collection has a unique index on user_id
    await predictions_collection.create_index("user_id", unique=True)

    # Check if prediction already exists for the user
    existing_prediction = await predictions_collection.find_one({"user_id": str(user.id)})
    if existing_prediction:
        return existing_prediction  # Return existing prediction

    # Format the user information into a prompt
    prompt = format_user_info(user)

    # Make the prediction using GroqCloud API
    headers = {
        "Authorization": f"Bearer {GROQCLOUD_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.groq.com/openai/v1/chat/completions", json=data, headers=headers)

    if response.status_code == 200:
        prediction = response.json()
        print("GroqCloud API response:", prediction)  # Debugging log

        # Parse the API response safely
        content = prediction.get("choices", [{}])[0].get("message", {}).get("content", "No prediction available")

        # Extract structured data
        predicted_diseases = []
        positive_habits = []
        areas_for_improvement = []
        recommendations = []
        lines = content.split('\n')
        current_section = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith('### 1. Predicted Diseases with likelihood in percentage'):
                current_section = 'predicted_diseases'
                continue
            elif line.startswith('### 2. Positive Habits'):
                current_section = 'positive_habits'
                continue
            elif line.startswith('### 3. Areas for Improvement'):
                current_section = 'areas_for_improvement'
                continue
            elif line.startswith('### 4. Recommendations'):
                current_section = 'recommendations'
                continue

            if current_section == 'predicted_diseases' and line.startswith('*'):
                parts = line[1:].split(':')
                condition = parts[0].strip()
                details = parts[1].strip() if len(parts) > 1 else ""
                predicted_diseases.append({"condition": condition, "details": details})
            elif current_section == 'positive_habits' and line.startswith('*'):
                positive_habits.append(line[1:].strip())
            elif current_section == 'areas_for_improvement' and line.startswith('*'):
                areas_for_improvement.append(line[1:].strip())
            elif current_section == 'recommendations' and line.startswith('*'):
                recommendations.append(line[1:].strip())

        # Create the prediction result
        prediction_result = {
            "user_id": str(user.id),  # Ensure user_id is a string
            "user_info": {
                "header": "Summary of User Information",
                "details": f"The user, {user.username}, is a {user.age}-year-old {user.gender} with a {user.activeness} lifestyle, "
                           f"{user.environment} environment, and existing {', '.join(user.genetic_diseases)}. They have vices such as "
                           f"{', '.join(user.vices)}, follow a {', '.join(user.food_intake)} diet, and get {user.sleep_hours} hours of sleep."
            },
            "predicted_diseases": predicted_diseases or [],
            "positive_habits": positive_habits or [],
            "areas_for_improvement": areas_for_improvement or [],
            "recommendations": recommendations or []
        }

        # Store the prediction result in the database
        await predictions_collection.insert_one(prediction_result)

        return prediction_result
    else:
        raise Exception(f"GroqCloud API error: {response.status_code} - {response.text}")

async def get_most_predicted_disease() -> str:
    pipeline = [
        {"$unwind": "$predicted_diseases"},
        {"$group": {"_id": "$predicted_diseases.condition", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    result = await predictions_collection.aggregate(pipeline).to_list(length=1)
    if result:
        return result[0]["_id"]
    return "No predictions available"

async def get_top_predicted_diseases() -> list:
    pipeline = [
        {"$unwind": "$predicted_diseases"},
        {"$group": {"_id": "$predicted_diseases.condition", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    result = await predictions_collection.aggregate(pipeline).to_list(length=5)
    return [{"condition": item["_id"], "count": item["count"]} for item in result]