"""
Badge Database Models
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(50), nullable=False)  # emoji or icon name
    
    # Requirements
    requirement_type = Column(String(50), nullable=False)  # corrections, streak, vocabulary, accuracy, level
    requirement_value = Column(Integer, nullable=False)
    
    # Badge Details
    category = Column(String(50), nullable=False)  # achievement, streak, mastery
    rarity = Column(String(20), default="common")  # common, rare, epic, legendary
    xp_bonus = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge")

class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    
    # Award Details
    earned_at = Column(DateTime, default=datetime.utcnow)
    is_displayed = Column(Boolean, default=True)  # Show in profile
    
    # Relationships
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="user_badges")

# Default badges to be seeded
DEFAULT_BADGES = [
    {
        "name": "Grammar Master",
        "description": "Complete 100 correct sentence corrections",
        "icon": "🏅",
        "requirement_type": "corrections",
        "requirement_value": 100,
        "category": "achievement",
        "rarity": "epic",
        "xp_bonus": 100
    },
    {
        "name": "7-Day Streak",
        "description": "Maintain a 7-day learning streak",
        "icon": "🔥",
        "requirement_type": "streak",
        "requirement_value": 7,
        "category": "streak",
        "rarity": "rare",
        "xp_bonus": 50
    },
    {
        "name": "Vocabulary Pro",
        "description": "Learn 200 vocabulary words",
        "icon": "📚",
        "requirement_type": "vocabulary",
        "requirement_value": 200,
        "category": "mastery",
        "rarity": "epic",
        "xp_bonus": 100
    },
    {
        "name": "Accuracy Star",
        "description": "Achieve 95%+ accuracy in a session",
        "icon": "🎯",
        "requirement_type": "accuracy",
        "requirement_value": 95,
        "category": "achievement",
        "rarity": "rare",
        "xp_bonus": 50
    },
    {
        "name": "Level Up Champion",
        "description": "Complete a level advancement",
        "icon": "🚀",
        "requirement_type": "level",
        "requirement_value": 1,
        "category": "achievement",
        "rarity": "common",
        "xp_bonus": 25
    },
    {
        "name": "First Steps",
        "description": "Complete your first learning session",
        "icon": "👣",
        "requirement_type": "sessions",
        "requirement_value": 1,
        "category": "achievement",
        "rarity": "common",
        "xp_bonus": 10
    },
    {
        "name": "Dedicated Learner",
        "description": "Complete 50 learning sessions",
        "icon": "📖",
        "requirement_type": "sessions",
        "requirement_value": 50,
        "category": "mastery",
        "rarity": "epic",
        "xp_bonus": 75
    },
    {
        "name": "30-Day Streak",
        "description": "Maintain a 30-day learning streak",
        "icon": "⭐",
        "requirement_type": "streak",
        "requirement_value": 30,
        "category": "streak",
        "rarity": "legendary",
        "xp_bonus": 200
    },
    {
        "name": "Polyglot Beginner",
        "description": "Practice in 3 different languages",
        "icon": "🌍",
        "requirement_type": "languages",
        "requirement_value": 3,
        "category": "achievement",
        "rarity": "rare",
        "xp_bonus": 50
    },
    {
        "name": "Perfect Session",
        "description": "Complete a session with 100% accuracy",
        "icon": "💯",
        "requirement_type": "perfect_session",
        "requirement_value": 1,
        "category": "achievement",
        "rarity": "epic",
        "xp_bonus": 100
    }
]
