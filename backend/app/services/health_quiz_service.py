from bson import ObjectId
from fastapi import HTTPException
from typing import List
from random import sample
from app.models.health_quiz_model import Question
from app.config import get_database

db = get_database()

# Create a new question
async def create_question(question: Question) -> Question:
    try:
        question_dict = question.dict(by_alias=True)
        question_dict["_id"] = ObjectId()  # Ensure _id is an ObjectId
        await db.health_quiz.insert_one(question_dict)
        return Question(**question_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# Create multiple questions
async def create_questions(questions: List[Question]) -> List[Question]:
    try:
        question_dicts = [question.dict(by_alias=True) for question in questions]
        for question_dict in question_dicts:
            question_dict["_id"] = ObjectId()  # Ensure _id is an ObjectId
        await db.health_quiz.insert_many(question_dicts)
        return [Question(**question_dict) for question_dict in question_dicts]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Get all questions
async def get_all_questions() -> List[Question]:
    try:
        questions = await db.health_quiz.find().to_list(length=None)
        return [Question(**{**q, "_id": q['_id']}) for q in questions]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Get 15 random questions
async def get_random_questions() -> List[Question]:
    try:
        questions = await db.health_quiz.find().to_list(length=None)
        if len(questions) < 15:
            raise HTTPException(status_code=400, detail="Not enough questions available")
        return [Question(**{**q, "_id": q['_id']}) for q in sample(questions, 10)]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Submit user quiz answers
async def submit_quiz(user_id: str, answers: List[str]):
    try:
        # Store quiz results
        quiz_result = {
            "user_id": user_id,
            "answers": answers,
            "score": sum(1 for ans in answers if ans["is_correct"]),
        }
        await db.health_quiz_results.insert_one(quiz_result)
        return {"message": "Quiz submitted successfully", "score": quiz_result["score"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Get user quiz history
async def get_user_quiz_history(user_id: str):
    try:
        history = await db.health_quiz_results.find({"user_id": user_id}).to_list(length=None)
        return history
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))