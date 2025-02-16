from bson import ObjectId
from fastapi import HTTPException
from typing import List
from app.models.daily_reward_model import DailyReward
from app.config import get_database

db = get_database()

async def create_daily_reward(daily_reward: DailyReward) -> DailyReward:
    try:
        daily_reward_dict = daily_reward.dict(by_alias=True)
        daily_reward_dict["_id"] = str(ObjectId())  # Convert ObjectId to string before inserting
        result = await db.daily_rewards.insert_one(daily_reward_dict)
        daily_reward.id = daily_reward_dict["_id"]  # Assign string ID back
        return daily_reward
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def read_daily_rewards() -> List[DailyReward]:
    try:
        rewards = await db.daily_rewards.find().to_list(length=None)
        return [DailyReward(**{**reward, "_id": str(reward["_id"])}) for reward in rewards]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def update_daily_reward(reward_id: str, daily_reward: DailyReward) -> DailyReward:
    try:
        reward_id_obj = ObjectId(reward_id)
        daily_reward_dict = daily_reward.dict(by_alias=True)
        await db.daily_rewards.update_one({"_id": reward_id_obj}, {"$set": daily_reward_dict})
        updated_reward = await db.daily_rewards.find_one({"_id": reward_id_obj})
        return DailyReward(**{**updated_reward, "_id": str(updated_reward["_id"])})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def delete_daily_reward(reward_id: str) -> DailyReward:
    try:
        reward_id_obj = ObjectId(reward_id)
        reward = await db.daily_rewards.find_one({"_id": reward_id_obj})
        if not reward:
            raise HTTPException(status_code=404, detail="Reward not found")
        await db.daily_rewards.delete_one({"_id": reward_id_obj})
        return DailyReward(**reward)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))