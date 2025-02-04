import os
import requests
from ..models.user_model import UserInDB
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load GroqCloud API key from environment variables
GROQCLOUD_API_KEY = os.getenv("GROQCLOUD_API_KEY")

def format_user_info(user: UserInDB) -> str:
    return (
        f"User Information:\n"
        f"Username: {user.username}\n"
        f"Email: {user.email}\n"
        f"Age: {user.age}\n"
        f"Gender: {user.gender}\n"
        f"Height: {user.height}\n"
        f"Weight: {user.weight}\n"
        f"Environment: {user.environment}\n"
        f"Vices: {', '.join(user.vices)}\n"
        f"Genetic Diseases: {', '.join(user.genetic_diseases)}\n"
        f"Lifestyle: {', '.join(user.lifestyle)}\n"
        f"Food Intake: {', '.join(user.food_intake)}\n"
        f"Sleep Hours: {user.sleep_hours}\n"
        f"Activeness: {user.activeness}\n"
        f"Analyze the provided user information and predict potential future diseases in a summarized or bulleted format. Identify positive lifestyle habits, suggest areas for improvement to help prevent these diseases, and estimate the likelihood (in percentage) of the user developing each predicted condition."
    )

def predict_disease(user: UserInDB) -> str:
    # Format the user information into a prompt
    prompt = format_user_info(user)

    # Make the prediction using GroqCloud API
    headers = {
        "Authorization": f"Bearer {GROQCLOUD_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=data, headers=headers)

    if response.status_code == 200:
        prediction = response.json()
        return prediction.get("choices", [{}])[0].get("message", {}).get("content", "No prediction available")
    else:
        raise Exception(f"GroqCloud API error: {response.status_code} - {response.text}")