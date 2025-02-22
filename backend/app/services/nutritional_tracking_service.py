import httpx
import os
from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime
from typing import List
from app.models.nutritional_tracking_model import NutritionalTracking, QuestionAnswer
from app.models.prediction_model import PredictionInDB
from app.config import get_database
from app.services.prediction_service import predict_disease

db = get_database()

GROQCLOUD_API_KEY = os.getenv("GROQCLOUD_API_KEY")

async def generate_nutritional_questions(prediction_result: PredictionInDB) -> List[str]:
    prompt = (
        f"Based on the following prediction result, generate ten nutritional tracking questions:\n"
        f"Predicted Diseases: {', '.join([d['condition'] for d in prediction_result['predicted_diseases']])}\n"
        f"Positive Habits: {', '.join(prediction_result['positive_habits'])}\n"
        f"Areas for Improvement: {', '.join(prediction_result['areas_for_improvement'])}\n"
        f"Recommendations: {', '.join(prediction_result['recommendations'])}\n"
        f"Questions should be focused on how the user is feeling, user improvements, and other relevant aspects. Your response should directly a set of 10 questions, no introduction, no conclusion, just the questions."
    )

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
        result = response.json()
        questions = result.get("choices", [{}])[0].get("message", {}).get("content", "").split('\n')
        return [q.strip() for q in questions if q.strip()]
    else:
        raise HTTPException(status_code=response.status_code, detail="Failed to generate questions")

async def create_nutritional_tracking(user_id: str) -> NutritionalTracking:
    try:
        # Fetch the user's prediction result
        prediction_result = await db.predictions.find_one({"user_id": user_id})
        if not prediction_result:
            raise HTTPException(status_code=404, detail="Prediction result not found")

        # Generate nutritional tracking questions
        questions = await generate_nutritional_questions(prediction_result)

        # Create question-answer pairs
        questions_answers = [QuestionAnswer(question=q, answer="") for q in questions]

        # Create nutritional tracking object
        nutritional_tracking = NutritionalTracking(
            user_id=user_id,  # Include user_id
            prediction_id=prediction_result["_id"],
            questions_answers=questions_answers,
            date_tracked=datetime.utcnow()
        )

        # Save nutritional tracking to database
        await db.nutritional_tracking.insert_one(nutritional_tracking.dict())

        return nutritional_tracking
    except Exception as e:
        print(f"Error creating nutritional tracking: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def read_nutritional_tracking(user_id: str) -> List[NutritionalTracking]:
    try:
        nutritional_tracking = await db.nutritional_tracking.find({"user_id": user_id}).to_list(length=None)
        return [NutritionalTracking(**item) for item in nutritional_tracking]
    except Exception as e:
        print(f"Error reading nutritional tracking: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def update_nutritional_tracking(tracking_id: str, question_index: int, answer: str) -> NutritionalTracking:
    try:
        # Fetch the existing tracking from the database
        tracking = await db.nutritional_tracking.find_one({"_id": ObjectId(tracking_id)})
        if not tracking:
            raise HTTPException(status_code=404, detail="Tracking not found")

        # Update the specific answer
        tracking["questions_answers"][question_index]["answer"] = answer

        # Update the tracking in the database
        await db.nutritional_tracking.update_one({"_id": ObjectId(tracking_id)}, {"$set": tracking})
        updated_tracking = await db.nutritional_tracking.find_one({"_id": ObjectId(tracking_id)})
        return NutritionalTracking(**updated_tracking)
    except Exception as e:
        print(f"Error updating nutritional tracking: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
