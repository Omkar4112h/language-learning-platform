"""
User Database Model
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base

class UserLevel(str, enum.Enum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # Language Learning Progress
    current_level = Column(SQLEnum(UserLevel), default=UserLevel.A1)
    target_language = Column(String(50), default="English")
    native_language = Column(String(50), default="English")
    
    # Gamification
    total_xp = Column(Integer, default=0)
    daily_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(DateTime, nullable=True)
    
    # Statistics
    total_sessions = Column(Integer, default=0)
    total_correct_answers = Column(Integer, default=0)
    total_wrong_answers = Column(Integer, default=0)
    words_learned = Column(Integer, default=0)
    
    # Account
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("LearningSession", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")
    learned_vocabulary = relationship("UserVocabulary", back_populates="user")
    
    def calculate_accuracy(self) -> float:
        """Calculate overall accuracy percentage"""
        total = self.total_correct_answers + self.total_wrong_answers
        if total == 0:
            return 0.0
        return round((self.total_correct_answers / total) * 100, 2)
    
    def get_next_level(self) -> str:
        """Get the next level for user"""
        levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
        current_idx = levels.index(self.current_level.value)
        if current_idx < len(levels) - 1:
            return levels[current_idx + 1]
        return "C2"  # Max level
    
    def xp_for_next_level(self) -> int:
        """Calculate XP needed for next level"""
        from app.core.config import settings
        next_level = self.get_next_level()
        return settings.LEVEL_XP_THRESHOLDS.get(next_level, 8000)
