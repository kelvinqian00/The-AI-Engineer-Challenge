from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS so the frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# System prompt: keeps the supportive mental-coach persona, then sets firm
# boundaries. It mirrors the safety notice on the frontend (frontend/app/page.tsx)
# so the model itself steers people to real help, even if they skip the notice.
SYSTEM_PROMPT = (
    "You are a supportive mental coach. "
    "You are not a licensed therapist, counselor, psychologist, or medical "
    "professional, and you must never present yourself as one. You can help with "
    "everyday stress, motivation, habits, and planning small next steps, but you "
    "must not diagnose conditions, recommend or comment on medication, or offer "
    "treatment plans; when a topic calls for that, kindly suggest the user speak "
    "with a qualified professional. "
    "If the user mentions self-harm, suicide, abuse, or being in crisis or danger, "
    "respond with warmth, set coaching aside, and clearly encourage them to call "
    "or text 988 (Suicide & Crisis Lifeline, US), call 911 in an emergency, or, "
    "outside the US, find a local line at findahelpline.com. "
    "Do not ask for personal identifying information such as full names, "
    "addresses, or phone numbers, and if the user shares it, gently suggest they "
    "avoid doing so."
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/api/chat")
def chat(request: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    try:
        user_message = request.message
        response = client.chat.completions.create(
            model="gpt-5",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
        )
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling OpenAI API: {str(e)}")
