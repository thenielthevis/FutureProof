from bson import ObjectId
from fastapi import HTTPException
from typing import List
from app.models.daily_reward_model import DailyReward
from app.config import get_database

db = get_database()

async def create_daily_reward(daily_reward: DailyReward) -> DailyReward:
    try:
        daily_reward_dict = daily_reward.dict(by_alias=True, exclude={"id"})  # Exclude "id" to prevent conflicts
        daily_reward_dict["_id"] = ObjectId()  # Store as ObjectId, not string

        result = await db.daily_rewards.insert_one(daily_reward_dict)
        
        # Convert MongoDB ObjectId to string for Pydantic response
        return DailyReward(**{**daily_reward_dict, "_id": str(daily_reward_dict["_id"])})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def read_daily_rewards() -> List[DailyReward]:
    try:
        rewards = await db.daily_rewards.find().to_list(length=None)
        
        # Convert `_id` to string for Pydantic response
        return [DailyReward(**{**reward, "_id": str(reward["_id"])}) for reward in rewards]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def update_daily_reward(reward_id: str, daily_reward: DailyReward) -> DailyReward:
    try:
        if not ObjectId.is_valid(reward_id):
            raise HTTPException(status_code=400, detail="Invalid ObjectId format")

        reward_id_obj = ObjectId(reward_id)

        # Convert Pydantic model to dictionary and remove None values
        daily_reward_dict = daily_reward.dict(exclude_unset=True)  # Only includes provided fields

        if not daily_reward_dict:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_result = await db.daily_rewards.update_one({"_id": reward_id_obj}, {"$set": daily_reward_dict})

        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Daily reward not found")

        updated_reward = await db.daily_rewards.find_one({"_id": reward_id_obj})
        if not updated_reward:
            raise HTTPException(status_code=404, detail="Updated daily reward not found")

        return DailyReward(**{**updated_reward, "_id": str(updated_reward["_id"])})  # Convert `_id` to string
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def delete_daily_reward(reward_id: str) -> DailyReward:
    try:
        if not ObjectId.is_valid(reward_id):
            raise HTTPException(status_code=400, detail="Invalid ObjectId format")

        reward_id_obj = ObjectId(reward_id)
        reward = await db.daily_rewards.find_one({"_id": reward_id_obj})

        if not reward:
            raise HTTPException(status_code=404, detail="Reward not found")

        await db.daily_rewards.delete_one({"_id": reward_id_obj})

        return DailyReward(**{**reward, "_id": str(reward["_id"])})  # Convert `_id` to string for response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
