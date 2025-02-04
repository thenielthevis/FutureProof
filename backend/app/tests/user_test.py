import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env file
load_dotenv()

GROQCLOUD_API_KEY = os.getenv("GROQCLOUD_API_KEY")
if not GROQCLOUD_API_KEY:
    raise ValueError("GROQCLOUD_API_KEY is not set in environment variables")

client = Groq(
    api_key=GROQCLOUD_API_KEY
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Explain the laptops in one sentence",
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)