"""
Certificate Pydantic Schemas
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CertificateCreate(BaseModel):
    level_completed: str
    language: str

class CertificateResponse(BaseModel):
    id: int
    certificate_id: str
    level_completed: str
    language: str
    total_xp: int
    total_sessions: int
    accuracy_average: float
    words_learned: int
    issued_at: datetime
    pdf_path: Optional[str]
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class CertificateEligibility(BaseModel):
    level: str
    is_eligible: bool
    current_xp: int
    required_xp: int
    xp_remaining: int
    language: str
