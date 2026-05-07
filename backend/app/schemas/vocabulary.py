"""
Vocabulary Pydantic Schemas
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Vocabulary Schemas
class VocabularyWordBase(BaseModel):
    word: str
    language: str
    difficulty_level: str
    meaning: str
    example_sentence: str
    pronunciation: Optional[str] = None
    part_of_speech: Optional[str] = None
    synonyms: Optional[str] = None
    antonyms: Optional[str] = None
    category: Optional[str] = None

class VocabularyWordCreate(VocabularyWordBase):
    pass

class VocabularyWordResponse(VocabularyWordBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class VocabularyQuizQuestion(BaseModel):
    word_id: int
    word: str
    question_type: str  # meaning, example, synonym
    question: str
    options: List[str]
    correct_answer: str

class VocabularyQuizAnswer(BaseModel):
    word_id: int
    user_answer: str
    word: Optional[str] = None
    language: Optional[str] = None
    difficulty_level: Optional[str] = None
    
class VocabularyQuizResult(BaseModel):
    word_id: int
    word: str
    is_correct: bool
    correct_answer: str
    user_answer: str
    xp_earned: int

class VocabularySessionWords(BaseModel):
    words: List[VocabularyWordResponse]
    quiz: List[VocabularyQuizQuestion]

class UserVocabularyProgress(BaseModel):
    word_id: int
    word: str
    is_learned: bool
    times_practiced: int
    correct_count: int
    wrong_count: int
    mastery_level: int
    first_seen: datetime
    last_practiced: Optional[datetime]
    
    class Config:
        from_attributes = True
