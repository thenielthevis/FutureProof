from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from app.models.health_quiz_model import Question, UserQuizSubmission
from app.services.health_quiz_service import (
    create_question, create_questions, get_all_questions, get_random_questions, get_user_quiz_history
)
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin, get_current_user
from app.services.user_service import update_user_coins_and_xp

router = APIRouter()

class ClaimRewardsRequest(BaseModel):
    coins: int
    xp: int

# Create a new quiz question (Admin only)
@router.post("/health_quiz/", response_model=Question)
async def create_question_route(
    question: Question, current_admin: UserInDB = Depends(get_current_admin)
):
    return await create_question(question)

# Get all quiz questions (Admin only)
@router.get("/health_quiz/", response_model=List[Question])
async def get_all_questions_route(current_admin: UserInDB = Depends(get_current_admin)):
    return await get_all_questions()

# Create multiple quiz questions (Admin only)
@router.post("/health_quiz/bulk", response_model=List[Question])
async def create_questions_route(
    questions: List[Question], current_admin: UserInDB = Depends(get_current_admin)
):
    return await create_questions(questions)

# Get 15 random questions for users
@router.get("/health_quiz/random", response_model=List[Question])
async def get_random_questions_route():
    return await get_random_questions()

# Get user quiz history
@router.get("/health_quiz/history/{user_id}")
async def get_user_quiz_history_route(user_id: str):
    return await get_user_quiz_history(user_id)

# Update user coins and XP after quiz completion
@router.post("/health_quiz/claim_rewards")
async def claim_rewards_route(
    request: ClaimRewardsRequest, current_user: UserInDB = Depends(get_current_user)
):
    user_id = current_user.id
    return await update_user_coins_and_xp(user_id, request.coins, request.xp)
