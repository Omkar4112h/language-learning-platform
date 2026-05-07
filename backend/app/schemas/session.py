"""
Learning Session Pydantic Schemas
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SessionType(str, Enum):
    CORRECTION = "correction"
    TRANSLATION = "translation"
    CONVERSATION = "conversation"
    VOCABULARY = "vocabulary"

# Session Schemas
class SessionCreate(BaseModel):
    session_type: SessionType
    target_language: str = "English"
    difficulty_level: str = "A1"

class SessionInteractionCreate(BaseModel):
    user_input: str
    is_vocabulary_quiz: bool = False

class SessionInteractionResponse(BaseModel):
    id: int
    user_input: str
    ai_response: str
    is_correct: int  # 0=wrong, 1=partial, 2=correct
    xp_awarded: int
    feedback: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: int
    session_id: str
    session_type: SessionType
    target_language: str
    difficulty_level: str
    correct_answers: int
    wrong_answers: int
    partial_answers: int
    xp_earned: int
    accuracy: float
    current_streak: int
    started_at: datetime
    ended_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class SessionSummary(BaseModel):
    session_id: str
    correct_answers: int
    wrong_answers: int
    partial_answers: int
    accuracy: float
    xp_earned: int
    total_user_xp: int
    current_level: str
    next_level_xp_required: int
    motivational_message: str
    streak_bonus_earned: bool = False
    badges_earned: List[str] = []

class SessionEnd(BaseModel):
    notes: Optional[str] = None
