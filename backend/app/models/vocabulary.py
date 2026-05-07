"""
Vocabulary Database Models
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base

class VocabularyWord(Base):
    __tablename__ = "vocabulary_words"
    
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), nullable=False, index=True)
    language = Column(String(50), nullable=False, index=True)
    difficulty_level = Column(String(10), nullable=False)  # A1, A2, B1, B2, C1, C2
    
    # Word Details
    meaning = Column(Text, nullable=False)
    example_sentence = Column(Text, nullable=False)
    pronunciation = Column(String(255), nullable=True)
    part_of_speech = Column(String(50), nullable=True)  # noun, verb, adjective, etc.
    synonyms = Column(Text, nullable=True)  # comma-separated
    antonyms = Column(Text, nullable=True)  # comma-separated
    
    # Categorization
    category = Column(String(100), nullable=True)  # food, travel, business, etc.
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user_progress = relationship("UserVocabulary", back_populates="vocabulary_word")

class UserVocabulary(Base):
    __tablename__ = "user_vocabulary"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vocabulary_id = Column(Integer, ForeignKey("vocabulary_words.id"), nullable=False)
    
    # Learning Progress
    is_learned = Column(Boolean, default=False)
    times_practiced = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    mastery_level = Column(Integer, default=0)  # 0-5
    
    # Timestamps
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_practiced = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="learned_vocabulary")
    vocabulary_word = relationship("VocabularyWord", back_populates="user_progress")
