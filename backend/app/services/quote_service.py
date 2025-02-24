from bson import ObjectId
from fastapi import HTTPException, Form
from typing import List, Optional
from app.models.quote_model import Quote
from app.config import get_database

db = get_database()

async def create_quote(
    text: str = Form(...),  # Accept form-data input
    author: Optional[str] = Form(None)
) -> Quote:
    try:
        quote_dict = {"text": text, "author": author, "_id": ObjectId()}  # Store ObjectId correctly
        result = await db.quotes.insert_one(quote_dict)

        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to insert quote")

        quote_dict["_id"] = str(result.inserted_id)  # Convert ObjectId to string
        return Quote(**quote_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def read_quotes() -> List[Quote]:
    try:
        quotes = await db.quotes.find().to_list(length=1000)  # Limit results for safety

        # Convert `_id` from ObjectId to string
        return [Quote(**{**quote, "_id": str(quote["_id"])}) for quote in quotes]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def update_quote(
    quote_id: str,
    text: Optional[str] = Form(None),  # Accept optional form-data fields
    author: Optional[str] = Form(None)
) -> Quote:
    try:
        if not ObjectId.is_valid(quote_id):  # Ensure valid ObjectId format
            raise HTTPException(status_code=400, detail="Invalid ObjectId format")

        quote_id_obj = ObjectId(quote_id)
        update_fields = {}

        if text:
            update_fields["text"] = text
        if author:
            update_fields["author"] = author

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_result = await db.quotes.update_one({"_id": quote_id_obj}, {"$set": update_fields})

        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Quote not found")

        updated_quote = await db.quotes.find_one({"_id": quote_id_obj})
        if not updated_quote:
            raise HTTPException(status_code=404, detail="Updated quote not found")

        updated_quote["_id"] = str(updated_quote["_id"])  # Convert ObjectId to string
        return Quote(**updated_quote)
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

        quote["_id"] = str(quote["_id"])  # Convert ObjectId to string
        return Quote(**quote)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
