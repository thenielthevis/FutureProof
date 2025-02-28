from fastapi import APIRouter, HTTPException
from app.services.task_completion_service import TaskCompletionService
from app.models.task_completion_model import TaskCompletion
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/task-completion", response_model=TaskCompletion)
def create_task_completion(task_completion: TaskCompletion):
    try:
        created_task_completion = TaskCompletionService.create_task_completion(
            user_id=task_completion.user_id,
            task_type=task_completion.task_type,
            time_spent=task_completion.time_spent,
            coins_received=task_completion.coins_received,
            xp_received=task_completion.xp_received,
            score=task_completion.score,
            total_questions=task_completion.total_questions
        )
        return created_task_completion
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/task-completion/user/{user_id}", response_model=List[TaskCompletion])
def get_task_completions_by_user(user_id: str):
    try:
        task_completions = TaskCompletionService.get_task_completions_by_user(user_id)
        return task_completions
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/task-completion", response_model=List[TaskCompletion])
async def get_all_task_completions():
    try:
        logger.info("Fetching all task completions")
        task_completions = await TaskCompletionService.get_all_task_completions()
        logger.info(f"Fetched {len(task_completions)} task completions")
        return task_completions
    except Exception as e:
        logger.error(f"Error fetching task completions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
