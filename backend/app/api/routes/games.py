"""
Games API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


class GameResult(BaseModel):
    game_type: str  # scramble, memory, hangman
    score: int
    xp_earned: int


class GameResponse(BaseModel):
    success: bool
    total_xp: int
    message: str


@router.post("/complete", response_model=GameResponse)
async def complete_game(
    result: GameResult,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record game completion and award XP"""
    
    # Validate XP (prevent cheating)
    max_xp = {
        'scramble': 15,
        'memory': 20,
        'hangman': 15,
    }
    
    game_max = max_xp.get(result.game_type, 15)
    xp_to_award = min(result.xp_earned, game_max)
    
    if xp_to_award > 0:
        current_user.total_xp += xp_to_award
        db.commit()
        db.refresh(current_user)
    
    return GameResponse(
        success=True,
        total_xp=current_user.total_xp,
        message=f"Earned {xp_to_award} XP from {result.game_type}!"
    )


@router.get("/stats")
async def get_game_stats(
    current_user: User = Depends(get_current_user)
):
    """Get user's game statistics"""
    return {
        "total_xp": current_user.total_xp,
        "current_level": current_user.current_level.value,
        "daily_streak": current_user.daily_streak
    }
