from fastapi import APIRouter, HTTPException
from app.services.achievement_service import (
    create_achievement,
    get_achievements,
    get_achievement_by_id,
    update_achievement,
    delete_achievement
)
from app.models.achievement_model import Achievement

router = APIRouter()

@router.post("/create/achievements", response_model=Achievement)
async def create_achievement_route(achievement: dict):  # Change to dict
    if "avatar_id" in achievement and achievement["avatar_id"]:
        achievement["avatar_id"] = str(achievement["avatar_id"])  # Ensure string
    return await create_achievement(achievement)

@router.get("/read/achievements", response_model=list[Achievement])
async def get_achievements_route():
    return await get_achievements()

@router.get("/read/achievements/{id}", response_model=Achievement)
async def get_achievement_by_id_route(id: str):
    achievement = await get_achievement_by_id(id)
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return achievement

@router.put("/achievements/{id}", response_model=Achievement)  # Changed from /update/achievements/{id}
async def update_achievement_route(id: str, achievement_data: dict):
    try:
        print(f"Received ID for update: {id}")  # Debug log
        print(f"Update data: {achievement_data}")  # Debug log
        updated_achievement = await update_achievement(id, achievement_data)
        if not updated_achievement:
            raise HTTPException(status_code=404, detail="Achievement not found")
        return updated_achievement
    except Exception as e:
        print(f"Error in update route: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/achievements/{id}", response_model=dict)  # Changed from /delete/achievements/{id}
async def delete_achievement_route(id: str):
    try:
        success = await delete_achievement(id)
        if not success:
            raise HTTPException(status_code=404, detail="Achievement not found")
        return {"message": "Achievement deleted"}
    except Exception as e:
        print(f"Error in delete route: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))