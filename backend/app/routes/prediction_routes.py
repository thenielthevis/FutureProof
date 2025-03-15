from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from app.services.user_service import get_user_by_token
from app.services.prediction_service import predict_disease, get_most_predicted_disease, get_top_predicted_diseases, get_latest_prediction, get_all_user_predictions
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
    
    # First try to get latest prediction
    latest_prediction = await get_latest_prediction(str(user.id))
    if latest_prediction:
        return latest_prediction
    
    # If no prediction exists, create a new one
    predicted_diseases = await predict_disease(user)
    return predicted_diseases

@router.post("/force_predict", response_model=PredictionResponse) 
async def force_predict(token: str = Depends(oauth2_scheme)):
    """Force create a new prediction regardless of existing predictions"""
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create new prediction without checking for existing ones
    predicted_diseases = await predict_disease(user)
    return predicted_diseases

@router.get("/most_predicted_disease", response_model=str)
async def most_predicted_disease():
    disease = await get_most_predicted_disease()
    return disease

@router.get("/top_predicted_diseases", response_model=List[dict])
async def top_predicted_diseases():
    diseases = await get_top_predicted_diseases()
    return diseases

@router.get("/latest_prediction", response_model=PredictionResponse)
async def get_latest(token: str = Depends(oauth2_scheme)):
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    prediction = await get_latest_prediction(str(user.id))
    if not prediction:
        # If no prediction exists, create a new one
        prediction = await predict_disease(user)
        if not prediction:
            raise HTTPException(status_code=404, detail="Failed to create prediction")
    return prediction

@router.get("/user_predictions", response_model=List[PredictionResponse])
async def get_user_predictions(token: str = Depends(oauth2_scheme)):
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    predictions = await get_all_user_predictions(str(user.id))
    return predictions