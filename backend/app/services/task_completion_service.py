from app.models.task_completion_model import TaskCompletion
from datetime import datetime
from app.config import get_database
from typing import Optional, List
import logging

db = get_database()
logger = logging.getLogger(__name__)

class TaskCompletionService:
    @staticmethod
    async def create_task_completion(user_id: str, task_type: str, time_spent: int, coins_received: int, xp_received: int, score: Optional[int] = None, total_questions: Optional[int] = None):
        task_completion = TaskCompletion(
            user_id=user_id,
            task_type=task_type,
            time_spent=time_spent,
            coins_received=coins_received,
            xp_received=xp_received,
            score=score,
            total_questions=total_questions,
            date_completed=datetime.utcnow()
        )
        await db.task_completions.insert_one(task_completion.model_dump(by_alias=True))
        return task_completion

    @staticmethod
    async def get_task_completions_by_user(user_id: str) -> List[TaskCompletion]:
        task_completions_cursor = db.task_completions.find({"user_id": user_id})
        task_completions = await task_completions_cursor.to_list(length=None)  # Convert cursor to list
        return [TaskCompletion(**task_completion) for task_completion in task_completions]

    @staticmethod
    async def get_all_task_completions() -> List[TaskCompletion]:
        task_completions_cursor = db.task_completions.find()
        task_completions = await task_completions_cursor.to_list(length=None)  # Convert cursor to list
        return [TaskCompletion(**task_completion) for task_completion in task_completions]
    
    @staticmethod
    async def get_total_time_spent_by_user(user_id: str) -> int:
        try:
            task_completions = await db.task_completions.find({"user_id": user_id}).to_list(length=None)
            total_time_spent = sum(task_completion["time_spent"] for task_completion in task_completions if task_completion["time_spent"])
            return total_time_spent
        except Exception as e:
            print(f"Error calculating total time spent by user: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))

