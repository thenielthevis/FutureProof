import os
import httpx
import re
import pytz
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from ..models.daily_assessment_model import DailyAssessment
from ..models.prediction_model import PredictionInDB
from ..models.task_completion_model import TaskCompletion
from ..models.nutritional_tracking_model import NutritionalTracking
from app.config import get_database
from dotenv import load_dotenv
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
import asyncio
from httpx import AsyncClient, TimeoutException

# Load environment variables
load_dotenv()
GROQCLOUD_API_KEY = os.getenv("GROQCLOUD_API_KEY")

# MongoDB setup
client = MongoClient(os.getenv("MONGODB_URI"))
db = get_database()
task_completions_collection = db.get_collection("task_completions")
nutritional_tracking_collection = db.get_collection("nutritional_tracking")
predictions_collection = db.get_collection("predictions")
daily_assessments_collection = db.get_collection("daily_assessments")

def convert_objectid_to_str(data):
    """Recursively converts ObjectId fields to strings in deeply nested structures."""
    if isinstance(data, dict):
        return {k: convert_objectid_to_str(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(i) for i in data]
    elif isinstance(data, ObjectId):
        return str(data)  # Convert ObjectId to string
    elif hasattr(data, "__dict__"):  # Convert objects with __dict__ attributes
        return {k: convert_objectid_to_str(v) for k, v in vars(data).items()}
    return data

async def get_daily_user_data(user_id: str):
    """Fetches daily user data for assessment."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    print(f"Fetching data for User ID: {user_id}")

    prediction = await predictions_collection.find_one({"user_id": str(user_id)})
    tasks = await task_completions_collection.find({"user_id": str(user_id), "date_completed": {"$gte": today}}).to_list(None)
    nutrition = await nutritional_tracking_collection.find_one({"user_id": str(user_id), "date_tracked": {"$gte": today}})

    # Debugging: Print stored task dates
    user_tasks = await task_completions_collection.find({"user_id": str(user_id)}).to_list(None)
    for task in user_tasks:
        print(f"Stored Date: {task.get('date_completed')}, Type: {type(task.get('date_completed'))}")

    # Convert ObjectId fields to strings for JSON serialization
    prediction = convert_objectid_to_str(prediction) if prediction else None
    tasks = convert_objectid_to_str(tasks)
    nutrition = convert_objectid_to_str(nutrition) if nutrition else None

    print(f"Final Fetched Prediction: {prediction}")
    print(f"Final Fetched Tasks: {tasks}")
    print(f"Final Fetched Nutrition: {nutrition}")

    return tasks, nutrition, prediction

async def analyze_with_groqcloud(tasks, nutrition, prediction):
    """Uses GroqCloud AI to analyze user data and update disease likelihoods."""
    
    predicted_diseases = prediction.get("predicted_diseases", []) if prediction else []

    prompt = f"""
    User's completed tasks for today:
    {tasks}

    User's nutritional tracking responses:
    {nutrition}

    Existing predicted diseases:
    {predicted_diseases}

    Based on the user's performance today, analyze and provide a structured response with the following format for each disease:

    ### Updated Predicted Diseases with likelihood in percentage
    * Disease Name: [Name] | Old Likelihood: [X]% → New Likelihood: [Y]%
    * Scientific Reasoning: [Detailed explanation of the change]
    * Supporting Evidence: [URL or citation to a scientific study, research paper, or medical guideline]

    ### Evidence-Based Recommendations
    * Recommendation: [Clear actionable recommendation]
    * Scientific Basis: [Brief explanation based on scientific evidence]
    * Reference: [URL to scientific paper or medical guideline supporting this recommendation]

    Please ensure all predictions and recommendations are supported by specific scientific studies or medical guidelines with accessible URLs.
    """

    headers = {
        "Authorization": f"Bearer {GROQCLOUD_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2000
    }

    try:
        async with AsyncClient(timeout=60.0) as client:  # Increased timeout to 60 seconds
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=data,
                headers=headers
            )

        if response.status_code == 200:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            updated_predictions = []
            recommendations = []
            current_prediction = {}
            current_recommendation = {}

            lines = content.split('\n')
            section = None

            for line in lines:
                if "### Updated Predicted Diseases" in line:
                    section = "predictions"
                elif "### Evidence-Based Recommendations" in line:
                    section = "recommendations"
                elif section == "predictions" and line.startswith("*"):
                    if "Disease Name:" in line:
                        if current_prediction:
                            updated_predictions.append(current_prediction)
                            current_prediction = {}
                        
                        # Updated regex pattern to match the new format
                        match = re.search(r"\* Disease Name: (.+?) \| Old Likelihood: (\d+)% → New Likelihood: (\d+)%", line)
                        if match:
                            condition, old_percentage, new_percentage = match.groups()
                            current_prediction.update({
                                "condition": condition.strip(),
                                "old_percentage": float(old_percentage),
                                "new_percentage": float(new_percentage)
                            })
                    elif "Scientific Reasoning:" in line:
                        current_prediction["reason"] = line.split("Scientific Reasoning:")[1].strip()
                    elif "Supporting Evidence:" in line:
                        current_prediction["evidence"] = line.split("Supporting Evidence:")[1].strip()
                
                elif section == "recommendations" and line.startswith("*"):
                    if "Recommendation:" in line:
                        if current_recommendation:
                            recommendations.append(current_recommendation)
                            current_recommendation = {}
                        current_recommendation["recommendation"] = line.split("Recommendation:")[1].strip()
                    elif "Scientific Basis:" in line:
                        current_recommendation["basis"] = line.split("Scientific Basis:")[1].strip()
                    elif "Reference:" in line:
                        current_recommendation["reference"] = line.split("Reference:")[1].strip()

            # Add the last items if they exist
            if current_prediction:
                updated_predictions.append(current_prediction)
            if current_recommendation:
                recommendations.append(current_recommendation)

            print("Generated Predictions:", updated_predictions)  # Debug print
            print("Generated Recommendations:", recommendations)  # Debug print

            return updated_predictions, recommendations

        else:
            raise Exception(f"GroqCloud API error: {response.status_code} - {response.text}")

    except TimeoutException as e:
        print(f"Timeout error: {str(e)}")
        raise Exception("The request to GroqCloud API timed out. Please try again.")
    except Exception as e:
        print(f"Error in analyze_with_groqcloud: {str(e)}")
        raise

async def create_daily_assessment(user_id: str):
    """Generates or updates a daily assessment."""
    
    tasks, nutrition, prediction = await get_daily_user_data(user_id)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    if not prediction:
        return {"status": "error", "message": "No prediction found. Please create an entry for your prediction first."}

    if not tasks:
        return {"status": "error", "message": "No tasks completed today. Complete at least one task to generate an assessment."}

    if not nutrition:
        return {"status": "error", "message": "No nutritional tracking found. Please log your meals to get a better assessment."}

    # Process the assessment with AI
    updated_predictions, recommendations = await analyze_with_groqcloud(tasks, nutrition, prediction)

    # Check if a daily assessment already exists
    existing_assessment = await daily_assessments_collection.find_one({"user_id": str(user_id), "date": {"$gte": today}})
    
    if existing_assessment:
        # Update the existing daily assessment
        await daily_assessments_collection.update_one(
            {"_id": existing_assessment["_id"]},
            {"$set": {
                "task_summary": tasks,
                "nutritional_analysis": nutrition,
                "updated_predictions": updated_predictions,
                "recommendations": recommendations
            }}
        )
        existing_assessment = await daily_assessments_collection.find_one({"_id": existing_assessment["_id"]})
        existing_assessment = convert_objectid_to_str(existing_assessment)
        return {"status": "success", "message": "Daily assessment updated successfully.", "data": existing_assessment}
    
    # Create a new daily assessment entry
    assessment_data = {
        "user_id": str(user_id),
        "date": datetime.utcnow(),
        "task_summary": tasks,
        "nutritional_analysis": nutrition,
        "updated_predictions": updated_predictions,
        "recommendations": recommendations
    }

    await daily_assessments_collection.insert_one(assessment_data)
    assessment_data = convert_objectid_to_str(assessment_data)

    return {
        "status": "success",
        "message": "Daily assessment generated successfully.",
        "data": assessment_data
    }

async def log_all_daily_assessments():
    daily_assessments = await db.daily_assessments.find().to_list(None)
    for assessment in daily_assessments:
        print(f"Daily Assessment: {assessment}")

async def get_daily_assessment(user_id: str):
    user_id = str(user_id)  # Ensure user_id is a string

    # Get the current UTC date range
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1) - timedelta(microseconds=1)

    print(f"🔍 Querying with: {today_start} to {today_end}")

    # Query MongoDB
    daily_assessment = await db.daily_assessments.find_one({
        "user_id": user_id,
        "date": {"$gte": today_start, "$lt": today_end}
    })

    # If no assessment found, return None
    if not daily_assessment:
        return None

    # Convert ObjectId fields to strings
    daily_assessment["_id"] = str(daily_assessment["_id"])

    # Convert any other ObjectId fields (if they exist)
    for key, value in daily_assessment.items():
        if isinstance(value, ObjectId):
            daily_assessment[key] = str(value)

    return jsonable_encoder(daily_assessment)  # Ensure it's JSON serializable

async def read_all_assessments():
    """Fetches all users' daily assessments and includes user details (name, age, gender, height, weight, environment, vices, genetic diseases, lifestyle, food intake, sleep hours, activeness)."""
    assessments = await daily_assessments_collection.find().to_list(None)

    # Extract user IDs from assessments
    user_ids = [assessment['user_id'] for assessment in assessments]

    # Fetch users matching these IDs
    users = await db.users.find(
        {"_id": {"$in": [ObjectId(user_id) for user_id in user_ids]}},
        {"username": 1, "email": 1, "age": 1, "gender": 1, "height": 1, "weight": 1, "environment": 1, "vices": 1, "genetic_diseases": 1, "lifestyle": 1, "food_intake": 1, "sleep_hours": 1, "activeness": 1}  # Fetch only required fields
    ).to_list(None)

    # Create a dictionary mapping user_id to user details
    user_dict = {str(user['_id']): {
        "username": user["username"],
        "email": user["email"],
        "age": user["age"],
        "gender": user["gender"],
        "height": user["height"],
        "weight": user["weight"],
        "environment": user["environment"],
        "vices": user["vices"],
        "genetic_diseases": user["genetic_diseases"],
        "lifestyle": user["lifestyle"],
        "food_intake": user["food_intake"],
        "sleep_hours": user["sleep_hours"],
        "activeness": user["activeness"]
    } for user in users}

    # Attach user details to assessments
    for assessment in assessments:
        user_info = user_dict.get(assessment['user_id'], {
            'username': 'Unknown User',
            'email': 'Unknown',
            'age': None,
            'gender': None,
            'height': None,
            'weight': None,
            'environment': None,
            'vices': [],
            'genetic_diseases': [],
            'lifestyle': [],
            'food_intake': [],
            'sleep_hours': None,
            'activeness': None
        })
        assessment.update(user_info)  # Merge user data into assessment

    return [convert_objectid_to_str(assessment) for assessment in assessments]

async def read_user_assessments(user_id: str):
    """Fetches the logged-in user's daily assessments and includes user details."""
    
    # ✅ Ensure user_id is compared as a string
    assessments = await daily_assessments_collection.find({"user_id": str(user_id)}).to_list(None)
    
    print(f"Assessments for user {user_id}: {assessments}")  # ✅ Debugging log

    if not assessments:
        print(f"No assessments found for user: {user_id}")  # ✅ Additional debugging
        return []

    # Fetch user details
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {
        "username": 1, "email": 1, "age": 1, "gender": 1, "height": 1, "weight": 1, 
        "environment": 1, "vices": 1, "genetic_diseases": 1, "lifestyle": 1, 
        "food_intake": 1, "sleep_hours": 1, "activeness": 1
    })

    if not user:
        print(f"User not found: {user_id}")  # ✅ Log if user is missing
        return []

    user_info = {
        "username": user["username"],
        "email": user["email"],
        "age": user["age"],
        "gender": user["gender"],
        "height": user["height"],
        "weight": user["weight"],
        "environment": user["environment"],
        "vices": user["vices"],
        "genetic_diseases": user["genetic_diseases"],
        "lifestyle": user["lifestyle"],
        "food_intake": user["food_intake"],
        "sleep_hours": user["sleep_hours"],
        "activeness": user["activeness"]
    }

    # Attach user details to assessments
    for assessment in assessments:
        assessment.update(user_info)  # Merge user data into assessment

    return [convert_objectid_to_str(assessment) for assessment in assessments]
