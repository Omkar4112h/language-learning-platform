"""
Missions API Routes
Real-Life Conversation Simulator & Mission Mode
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()


class ObjectiveResult(BaseModel):
    text: str
    completed: bool


class MissionResult(BaseModel):
    mission_id: str  # restaurant, hotel, directions, interview, shopping, taxi
    language: str
    objectives_completed: int
    total_objectives: int
    xp_earned: int
    duration_seconds: Optional[int] = None


class MissionResponse(BaseModel):
    success: bool
    total_xp: int
    message: str


class MissionResponse(BaseModel):
    success: bool
    total_xp: int
    message: str
    new_level: Optional[str] = None


# XP rewards by mission difficulty
MISSION_XP = {
    'directions': 25,   # Easy
    'taxi': 25,         # Easy
    'restaurant': 30,   # Easy
    'shopping': 30,     # Easy
    'hotel': 35,        # Medium
    'interview': 40,    # Hard
}


@router.post("/complete", response_model=MissionResponse)
async def complete_mission(
    result: MissionResult,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record mission completion and award XP"""
    
    # Validate mission_id
    if result.mission_id not in MISSION_XP:
        raise HTTPException(status_code=400, detail="Invalid mission ID")
    
    # Calculate XP based on completion percentage
    max_xp = MISSION_XP.get(result.mission_id, 25)
    completion_rate = result.objectives_completed / max(result.total_objectives, 1)
    
    # Award XP based on completion (minimum 50% to get any XP)
    if completion_rate >= 0.5:
        xp_to_award = int(max_xp * completion_rate)
        xp_to_award = min(xp_to_award, result.xp_earned, max_xp)
    else:
        xp_to_award = 0
    
    # Store previous level
    previous_level = current_user.current_level.value
    
    if xp_to_award > 0:
        current_user.total_xp += xp_to_award
        
        # Check for level up
        new_level = calculate_level(current_user.total_xp)
        if new_level != current_user.current_level.value:
            from app.models.user import UserLevel
            current_user.current_level = UserLevel(new_level)
        
        db.commit()
        db.refresh(current_user)
    
    new_level_msg = None
    if current_user.current_level.value != previous_level:
        new_level_msg = current_user.current_level.value
    
    mission_names = {
        'restaurant': 'Order Food',
        'hotel': 'Book a Hotel',
        'directions': 'Ask Directions',
        'interview': 'Job Interview',
        'shopping': 'Go Shopping',
        'taxi': 'Take a Taxi'
    }
    
    return MissionResponse(
        success=True,
        total_xp=current_user.total_xp,
        message=f"Mission '{mission_names.get(result.mission_id, result.mission_id)}' completed! Earned {xp_to_award} XP!",
        new_level=new_level_msg
    )


def calculate_level(total_xp: int) -> str:
    """Calculate CEFR level based on configured XP thresholds."""
    thresholds = settings.LEVEL_XP_THRESHOLDS

    if total_xp >= thresholds.get("C2", 8000):
        return "C2"
    if total_xp >= thresholds.get("C1", 5000):
        return "C1"
    if total_xp >= thresholds.get("B2", 3500):
        return "B2"
    if total_xp >= thresholds.get("B1", 2000):
        return "B1"
    if total_xp >= thresholds.get("A2", 1000):
        return "A2"
    return "A1"


@router.get("/stats")
async def get_mission_stats(
    current_user: User = Depends(get_current_user)
):
    """Get user's mission statistics"""
    return {
        "total_xp": current_user.total_xp,
        "current_level": current_user.current_level.value,
        "daily_streak": current_user.daily_streak,
        "available_missions": list(MISSION_XP.keys())
    }


@router.get("/available")
async def get_available_missions():
    """Get list of available missions with details"""
    missions = [
        {
            "id": "restaurant",
            "name": "Order Food",
            "description": "Practice ordering food at a restaurant",
            "difficulty": "easy",
            "xp": 30,
            "ai_role": "Waiter",
            "user_role": "Customer"
        },
        {
            "id": "hotel",
            "name": "Book a Hotel",
            "description": "Book a room and ask about amenities",
            "difficulty": "medium",
            "xp": 35,
            "ai_role": "Receptionist",
            "user_role": "Guest"
        },
        {
            "id": "directions",
            "name": "Ask Directions",
            "description": "Ask for and understand directions",
            "difficulty": "easy",
            "xp": 25,
            "ai_role": "Local Person",
            "user_role": "Tourist"
        },
        {
            "id": "interview",
            "name": "Job Interview",
            "description": "Practice a job interview conversation",
            "difficulty": "hard",
            "xp": 40,
            "ai_role": "Interviewer",
            "user_role": "Candidate"
        },
        {
            "id": "shopping",
            "name": "Go Shopping",
            "description": "Buy items and negotiate prices",
            "difficulty": "easy",
            "xp": 30,
            "ai_role": "Shopkeeper",
            "user_role": "Shopper"
        },
        {
            "id": "taxi",
            "name": "Take a Taxi",
            "description": "Get a taxi and communicate destination",
            "difficulty": "easy",
            "xp": 25,
            "ai_role": "Taxi Driver",
            "user_role": "Passenger"
        }
    ]
    return {"missions": missions}
