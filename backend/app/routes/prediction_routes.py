from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from app.services.user_service import get_user_by_token
from app.services.prediction_service import predict_disease
from app.models.prediction_model import PredictionResponse
from typing import List

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Token(BaseModel):
    access_token: str
    token_type: str
    
@router.post("/predict", response_model=PredictionResponse)
async def predict(token: str = Depends(oauth2_scheme)):
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    predicted_diseases = await predict_disease(user)  # Ensure this is awaited
    print("Prediction response:", predicted_diseases)  # Add this line to log the response
    return predicted_diseases