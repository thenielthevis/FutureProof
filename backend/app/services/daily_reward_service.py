from bson import ObjectId
from fastapi import HTTPException
from typing import List
from app.models.daily_reward_model import DailyReward, DailyRewardClaim
from app.models.user_model import UserInDB
from app.config import get_database
from datetime import datetime, timedelta
import logging
import pytz

logger = logging.getLogger(__name__)

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

# Function to claim daily reward
async def claim_daily_reward_service(reward: DailyRewardClaim):
    logger.info(f"Processing reward claim: {reward}")
    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(reward.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if the reward has already been claimed
    reward_id_obj = ObjectId(reward.reward_id)
    if reward_id_obj in user.get("claimed_rewards", []):
        raise HTTPException(status_code=400, detail="Reward already claimed for this day")

    # Check if the next claim time has passed
    if user.get("next_claim_time") and datetime.utcnow() < user["next_claim_time"]:
        raise HTTPException(status_code=400, detail="Cannot claim reward yet")

    # Update user's coins and XP
    new_coins = user.get("coins", 0) + reward.coins
    new_xp = user.get("xp", 0) + reward.xp

    # Update user's avatars if applicable
    if reward.avatar_id:
        if "avatars" not in user:
            user["avatars"] = []
        user["avatars"].append(ObjectId(reward.avatar_id))

    # Update user's assets if applicable
    if reward.asset_id:
        if "assets" not in user:
            user["assets"] = []
        user["assets"].append(ObjectId(reward.asset_id))

    # Add the claimed reward to the list and set the next claim time (Stored in UTC)
    claimed_rewards = user.get("claimed_rewards", [])
    claimed_rewards.append(reward_id_obj)
    next_claim_time_utc = datetime.utcnow() + timedelta(hours=24)

    update_data = {
        "coins": new_coins,
        "xp": new_xp,
        "avatars": user.get("avatars", []),
        "assets": user.get("assets", []),
        "claimed_rewards": claimed_rewards,
        "next_claim_time": next_claim_time_utc  # Store in UTC
    }

    await db["users"].update_one({"_id": ObjectId(reward.user_id)}, {"$set": update_data})

    # Convert UTC to Philippine Time for Response
    philippines_tz = pytz.timezone('Asia/Manila')
    next_claim_time_ph = next_claim_time_utc.replace(tzinfo=pytz.utc).astimezone(philippines_tz)
    next_claim_time_str = next_claim_time_ph.strftime('%Y-%m-%d %H:%M:%S %Z%z')

    # Convert ObjectId to string for the response
    updated_user = {
        "coins": new_coins,
        "xp": new_xp,
        "avatars": [str(avatar) for avatar in user.get("avatars", [])],
        "assets": [str(asset) for asset in user.get("assets", [])],
        "next_claim_time": next_claim_time_str  # Show in Philippine Time
    }

    return updated_user