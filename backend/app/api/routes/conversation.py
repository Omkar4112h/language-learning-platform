"""
Conversation Practice API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.session import LearningSession, SessionInteraction, SessionType
from app.schemas.language import ConversationRequest, ConversationResponse, ConversationScenario
from app.services.nlp_service import ConversationService
from app.services.gamification_service import GamificationService

router = APIRouter()

# Store conversation context per user session
conversation_contexts = {}


def _context_key(user_id: int, scenario: str) -> str:
    # Keep per-scenario context isolated (e.g., 'help' vs 'restaurant')
    return f"{user_id}:{scenario or 'casual'}"

@router.post("/message", response_model=ConversationResponse)
async def send_message(
    request: ConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in conversation practice"""
    # Get or create conversation context
    scenario = request.scenario or "casual"
    user_key = _context_key(current_user.id, scenario)
    if user_key not in conversation_contexts:
        conversation_contexts[user_key] = {
            "response_count": 0,
            "scenario": scenario,
            "history": []
        }
    
    context = conversation_contexts[user_key]
    
    # Initialize conversation service
    conv_service = ConversationService(
        language=current_user.target_language,
        level=current_user.current_level.value
    )
    
    # Get AI response
    result = conv_service.get_response(
        user_message=request.message,
        scenario=context["scenario"],
        response_count=context["response_count"],
        history=context.get("history")
    )
    
    # Update context
    context["response_count"] = result["response_count"]
    context["history"].append({
        "user": request.message,
        "ai": result["response"]
    })
    
    # Check for active session
    active_session = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at == None,
        LearningSession.session_type == SessionType.CONVERSATION
    ).first()
    
    # Award XP for conversation practice, but not for AI Help.
    xp = 0 if context["scenario"] == "help" else 5

    if xp:
        gamification = GamificationService(db)
        gamification.update_user_xp(current_user, xp)
    
    if active_session:
        interaction = SessionInteraction(
            session_id=active_session.id,
            user_input=request.message,
            ai_response=result["response"],
            is_correct=1,  # Partial for conversations
            xp_awarded=xp,
            feedback=result.get("feedback")
        )
        db.add(interaction)
        
        active_session.partial_answers += 1
        active_session.xp_earned += xp
    
    db.commit()
    
    return ConversationResponse(
        ai_response=result["response"],
        feedback=result.get("feedback"),
        fluency_tips=result.get("fluency_tips"),
        vocabulary_suggestions=result.get("vocabulary_suggestions"),
        should_give_feedback=result["should_give_feedback"],
        response_count=result["response_count"]
    )

@router.get("/scenarios", response_model=List[ConversationScenario])
async def get_scenarios(current_user: User = Depends(get_current_user)):
    """Get available conversation scenarios"""
    conv_service = ConversationService(
        language=current_user.target_language,
        level=current_user.current_level.value
    )
    
    scenarios = conv_service.get_scenarios()
    return [ConversationScenario(**s) for s in scenarios]

@router.post("/start-scenario")
async def start_scenario(
    scenario: str,
    current_user: User = Depends(get_current_user)
):
    """Start a new conversation scenario"""
    user_key = _context_key(current_user.id, scenario)
    
    # Reset conversation context
    conversation_contexts[user_key] = {
        "response_count": 0,
        "scenario": scenario,
        "history": []
    }
    
    # Get scenario info
    conv_service = ConversationService(
        language=current_user.target_language,
        level=current_user.current_level.value
    )
    
    scenarios = {s["name"].lower().replace(" ", "_"): s for s in conv_service.get_scenarios()}
    scenario_key = scenario.lower().replace(" ", "_")
    
    if scenario_key in scenarios:
        scenario_info = scenarios[scenario_key]
    else:
        scenario_info = {
            "name": scenario.title(),
            "description": f"Practice {scenario} conversations",
            "suggested_phrases": ["Hello!", "How can I help you?", "Thank you!"]
        }
    
    # Generate opening message
    opening_messages = {
        "restaurant": "Welcome to our restaurant! What would you like to order today?",
        "interview": "Hello! Thank you for coming in today. Please, tell me about yourself.",
        "travel": "Excuse me, I see you might need some help. Where are you trying to go?",
        "shopping": "Welcome to our store! Is there anything specific you're looking for?",
        "casual": "Hey! How's it going? What have you been up to lately?"
    }
    
    opening = opening_messages.get(scenario, "Hello! Let's start our conversation. What would you like to talk about?")
    
    return {
        "scenario": scenario_info,
        "opening_message": opening,
        "tips": [
            f"Try to respond naturally as if you're in a real {scenario} situation.",
            "Don't worry about making mistakes - they help you learn!",
            "You'll receive feedback every 3 messages."
        ]
    }

@router.get("/history")
async def get_conversation_history(current_user: User = Depends(get_current_user)):
    """Get current conversation history"""
    # Default to 'casual' history for backward compatibility.
    user_key = _context_key(current_user.id, "casual")

    if user_key not in conversation_contexts:
        return {"history": [], "response_count": 0, "scenario": "casual"}

    context = conversation_contexts[user_key]
    return {"history": context["history"], "response_count": context["response_count"], "scenario": context["scenario"]}

@router.post("/reset")
async def reset_conversation(current_user: User = Depends(get_current_user)):
    """Reset conversation context"""
    user_prefix = f"{current_user.id}:"
    keys_to_delete = [key for key in conversation_contexts.keys() if key.startswith(user_prefix)]
    for key in keys_to_delete:
        del conversation_contexts[key]
    
    return {"message": "Conversation reset successfully"}
