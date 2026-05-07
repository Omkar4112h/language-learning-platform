"""
Badge Pydantic Schemas
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BadgeBase(BaseModel):
    name: str
    description: str
    icon: str
    requirement_type: str
    requirement_value: int
    category: str
    rarity: str = "common"
    xp_bonus: int = 0

class BadgeCreate(BadgeBase):
    pass

class BadgeResponse(BadgeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserBadgeResponse(BaseModel):
    id: int
    badge: BadgeResponse
    earned_at: datetime
    is_displayed: bool
    
    class Config:
        from_attributes = True

class BadgeUnlockNotification(BaseModel):
    badge_name: str
    badge_icon: str
    badge_description: str
    xp_bonus: int
    message: str
