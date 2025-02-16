from fastapi import APIRouter, HTTPException, Depends, Form
from typing import List, Optional
from app.models.daily_reward_model import DailyReward
from app.services.daily_reward_service import create_daily_reward, read_daily_rewards, update_daily_reward, delete_daily_reward
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin

router = APIRouter()

# Create a daily reward
@router.post("/daily_rewards/")
async def create_daily_reward_route(
    day: int = Form(...),
    coins: Optional[int] = Form(0),
    current_admin: UserInDB = Depends(get_current_admin),
):
    # Convert dictionary to Pydantic model
    daily_reward = DailyReward(day=day, coins=coins)
    return await create_daily_reward(daily_reward)

# Read all daily rewards
@router.get("/daily_rewards/", response_model=List[DailyReward])
async def read_daily_rewards_route():
    return await read_daily_rewards()

# Update a daily reward
@router.put("/daily_rewards/{reward_id}", response_model=DailyReward)
async def update_daily_reward_route(
    reward_id: str,
    day: int = Form(...),
    coins: int = Form(0),
    current_admin: UserInDB = Depends(get_current_admin)
):
    daily_reward = DailyReward(day=day, coins=coins)
    return await update_daily_reward(reward_id, daily_reward)

# Delete a daily reward
@router.delete("/daily_rewards/{reward_id}", response_model=DailyReward)
async def delete_daily_reward_route(reward_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    return await delete_daily_reward(reward_id)