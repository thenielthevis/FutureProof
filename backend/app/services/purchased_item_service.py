from bson import ObjectId
from fastapi import HTTPException
from app.models.purchased_item_model import PurchasedItem
from app.config import get_database

db = get_database()

async def add_purchased_item(user_id: str, asset) -> PurchasedItem:
    try:
        purchased_item = PurchasedItem(
            user_id=user_id,
            asset_id=str(asset["_id"]),
            name=asset["name"],
            description=asset["description"],
            url=asset["url"],
            image_url=asset["image_url"],
            price=asset["price"],
            asset_type=asset["asset_type"]
        )
        await db.purchased_items.insert_one(purchased_item.dict())
        return purchased_item
    except Exception as e:
        print(f"Error adding purchased item: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def get_purchased_items(user_id: str) -> list[PurchasedItem]:
    try:
        items = await db.purchased_items.find({"user_id": user_id}).to_list(length=None)
        return [PurchasedItem(**item) for item in items]
    except Exception as e:
        print(f"Error fetching purchased items: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
