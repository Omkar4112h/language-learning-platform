"""
Language Processing Pydantic Schemas
"""

from pydantic import BaseModel
from typing import Optional, List

# Sentence Correction Schemas
class CorrectionRequest(BaseModel):
    sentence: str
    target_language: str = "English"
    user_level: str = "A1"

class CorrectionResponse(BaseModel):
    original_sentence: str
    corrected_sentence: str
    has_errors: bool
    errors: List[dict]  # List of {type, original, correction, explanation}
    explanation: str
    rule_summary: str
    alternative_sentence: str
    score: int  # 0-100
    xp_earned: int

# Translation Schemas
class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str
    user_level: str = "A1"

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    contextual_explanation: str
    alternative_variations: List[str]
    grammar_notes: Optional[str] = None
    cultural_notes: Optional[str] = None

# Conversation Schemas
class ConversationRequest(BaseModel):
    message: str
    conversation_context: Optional[str] = None
    scenario: Optional[str] = None  # restaurant, interview, travel, etc.

class ConversationResponse(BaseModel):
    ai_response: str
    feedback: Optional[str] = None
    fluency_tips: Optional[List[str]] = None
    vocabulary_suggestions: Optional[List[str]] = None
    should_give_feedback: bool = False
    response_count: int = 0

class ConversationScenario(BaseModel):
    name: str
    description: str
    difficulty: str
    suggested_phrases: List[str]
