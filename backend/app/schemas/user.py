"""
User Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserLevel(str, Enum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    target_language: str = "English"
    native_language: str = "English"
    current_level: UserLevel = UserLevel.A1

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    target_language: Optional[str] = None
    native_language: Optional[str] = None
    current_level: Optional[UserLevel] = None

class UserProgress(BaseModel):
    total_xp: int
    daily_streak: int
    longest_streak: int
    total_sessions: int
    total_correct_answers: int
    total_wrong_answers: int
    words_learned: int
    accuracy: float
    current_level: str
    next_level: str
    xp_for_next_level: int

class UserResponse(UserBase):
    id: int
    current_level: UserLevel
    target_language: str
    native_language: str
    total_xp: int
    daily_streak: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserDetailResponse(UserResponse):
    longest_streak: int
    total_sessions: int
    total_correct_answers: int
    total_wrong_answers: int
    words_learned: int
    last_activity_date: Optional[datetime]
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None
