"""
Learning Session Database Model
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.core.database import Base

class SessionType(str, enum.Enum):
    CORRECTION = "correction"
    TRANSLATION = "translation"
    CONVERSATION = "conversation"
    VOCABULARY = "vocabulary"

class LearningSession(Base):
    __tablename__ = "learning_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), unique=True, index=True, default=lambda: str(uuid.uuid4())[:8])
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Session Details
    session_type = Column(SQLEnum(SessionType), nullable=False)
    target_language = Column(String(50), nullable=False)
    difficulty_level = Column(String(10), nullable=False)  # A1, A2, B1, B2, C1, C2
    
    # Performance Metrics
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    partial_answers = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    current_streak = Column(Integer, default=0)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    
    # Session Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    interactions = relationship("SessionInteraction", back_populates="session")
    
    def calculate_accuracy(self):
        """Calculate session accuracy"""
        total = self.correct_answers + self.wrong_answers + self.partial_answers
        if total == 0:
            return 0.0
        return round((self.correct_answers / total) * 100, 2)
    
    def get_motivational_message(self):
        """Get motivational message based on accuracy"""
        acc = self.calculate_accuracy()
        if acc >= 90:
            return "🌟 Excellent! You're doing amazing!"
        elif acc >= 70:
            return "👏 Great Progress! Keep it up!"
        elif acc >= 50:
            return "💪 Keep Practicing! You're improving!"
        else:
            return "🤗 Let's Improve Together! Every step counts!"

class SessionInteraction(Base):
    __tablename__ = "session_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("learning_sessions.id"), nullable=False)
    
    # Interaction Details
    user_input = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    is_correct = Column(Integer, default=0)  # 0=wrong, 1=partial, 2=correct
    xp_awarded = Column(Integer, default=0)
    feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("LearningSession", back_populates="interactions")
