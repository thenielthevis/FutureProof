from fastapi import APIRouter, HTTPException, Depends, Form
from typing import List, Optional
from app.models.quote_model import Quote
from app.services.quote_service import create_quote, read_quotes, update_quote, delete_quote
from app.models.user_model import UserInDB
from app.dependencies import get_current_admin

router = APIRouter()

# Create a quote (supports form-data)
@router.post("/quotes/", response_model=Quote)
async def create_quote_route(
    text: str = Form(...),
    author: Optional[str] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin)
):
    return await create_quote(text, author)

# Read all quotes
@router.get("/quotes/", response_model=List[Quote])
async def read_quotes_route():
    return await read_quotes()

# Update a quote (supports form-data)
@router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote_route(
    quote_id: str,
    text: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    current_admin: UserInDB = Depends(get_current_admin)
):
    return await update_quote(quote_id, text, author)

# Delete a quote
@router.delete("/quotes/{quote_id}", response_model=Quote)
async def delete_quote_route(quote_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    return await delete_quote(quote_id)
