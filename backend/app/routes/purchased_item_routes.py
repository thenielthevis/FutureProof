from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from app.services.purchased_item_service import add_purchased_item, get_purchased_items
from app.services.user_service import get_user_by_token
from app.models.purchased_item_model import PurchasedItem
from app.models.user_model import UserInDB
from bson import ObjectId
from app.config import get_database

db = get_database()
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/purchase")
async def purchase_item(asset_id: str, token: str = Depends(oauth2_scheme)):
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if user.coins < asset["price"]:
        raise HTTPException(status_code=400, detail="Insufficient coins")

    user.coins -= asset["price"]
    await db.users.update_one({"_id": user.id}, {"$set": {"coins": user.coins}})

    purchased_item = await add_purchased_item(str(user.id), asset)
    return purchased_item

@router.get("/purchased-items", response_model=list[PurchasedItem])
async def get_purchased_items_route(token: str = Depends(oauth2_scheme)):
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    items = await get_purchased_items(str(user.id))
    return items
