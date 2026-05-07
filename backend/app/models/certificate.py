"""
Certificate Database Model
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base

class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(50), unique=True, index=True, default=lambda: f"CERT-{str(uuid.uuid4())[:8].upper()}")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Certificate Details
    level_completed = Column(String(10), nullable=False)  # A1, A2, B1, B2, C1, C2
    language = Column(String(50), nullable=False)
    
    # Performance Summary
    total_xp = Column(Integer, nullable=False)
    total_sessions = Column(Integer, default=0)
    accuracy_average = Column(Float, default=0.0)
    words_learned = Column(Integer, default=0)
    
    # Certificate Meta
    issued_at = Column(DateTime, default=datetime.utcnow)
    pdf_path = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="certificates")
