from bson import ObjectId
from fastapi import HTTPException
from typing import List
from app.models.quote_model import Quote
from app.config import get_database

db = get_database()

async def create_quote(quote: Quote) -> Quote:
    try:
        quote_dict = quote.dict(by_alias=True, exclude={"id"})  # Exclude "id" to prevent conflicts
        quote_dict["_id"] = ObjectId()  # Store as ObjectId, not string

        result = await db.quotes.insert_one(quote_dict)
        
        # Convert MongoDB ObjectId to string for Pydantic response
        return Quote(**{**quote_dict, "_id": str(quote_dict["_id"])})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def read_quotes() -> List[Quote]:
    try:
        quotes = await db.quotes.find().to_list(length=None)
        
        # Convert `_id` to string for Pydantic response
        return [Quote(**{**quote, "_id": str(quote["_id"])}) for quote in quotes]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def update_quote(quote_id: str, quote: Quote) -> Quote:
    try:
        if not ObjectId.is_valid(quote_id):
            raise HTTPException(status_code=400, detail="Invalid ObjectId format")

        quote_id_obj = ObjectId(quote_id)

        # Convert Pydantic model to dictionary and remove None values
        quote_dict = quote.dict(exclude_unset=True)  # Only includes provided fields

        if not quote_dict:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_result = await db.quotes.update_one({"_id": quote_id_obj}, {"$set": quote_dict})

        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Quote not found")

        updated_quote = await db.quotes.find_one({"_id": quote_id_obj})
        if not updated_quote:
            raise HTTPException(status_code=404, detail="Updated quote not found")

        return Quote(**{**updated_quote, "_id": str(updated_quote["_id"])})  # Convert `_id` to string
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def delete_quote(quote_id: str) -> Quote:
    try:
        if not ObjectId.is_valid(quote_id):
            raise HTTPException(status_code=400, detail="Invalid ObjectId format")

        quote_id_obj = ObjectId(quote_id)
        quote = await db.quotes.find_one({"_id": quote_id_obj})

        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")

        await db.quotes.delete_one({"_id": quote_id_obj})

        return Quote(**{**quote, "_id": str(quote["_id"])})  # Convert `_id` to string for response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))