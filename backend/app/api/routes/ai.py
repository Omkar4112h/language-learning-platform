from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import ask_gpt

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat(req: ChatRequest):

    reply = ask_gpt(req.message)

    return {
        "reply": reply
    }