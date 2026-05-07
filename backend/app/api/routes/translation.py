"""
Translation API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.session import LearningSession, SessionInteraction, SessionType
from app.schemas.language import TranslationRequest, TranslationResponse
from app.services.nlp_service import TranslationService
from app.services.gamification_service import GamificationService

router = APIRouter()

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Translate text between languages"""
    # Validate languages
    if request.source_language not in settings.SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Source language not supported. Choose from: {', '.join(settings.SUPPORTED_LANGUAGES)}"
        )
    
    if request.target_language not in settings.SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target language not supported. Choose from: {', '.join(settings.SUPPORTED_LANGUAGES)}"
        )
    
    # Perform translation
    translator = TranslationService()
    result = translator.translate(
        text=request.text,
        source_lang=request.source_language,
        target_lang=request.target_language
    )
    
    # Record in active session if exists
    active_session = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at == None,
        LearningSession.session_type == SessionType.TRANSLATION
    ).first()
    
    # Always award XP for translation practice
    xp = 5
    gamification = GamificationService(db)
    gamification.update_user_xp(current_user, xp)
    
    if active_session:
        interaction = SessionInteraction(
            session_id=active_session.id,
            user_input=request.text,
            ai_response=result["translated"],
            is_correct=1,  # Partial for translations
            xp_awarded=xp,
            feedback=result["explanation"]
        )
        db.add(interaction)
        
        active_session.partial_answers += 1
        active_session.xp_earned += xp
    
    db.commit()
    
    return TranslationResponse(
        original_text=result["original"],
        translated_text=result["translated"],
        contextual_explanation=result["explanation"],
        alternative_variations=result["alternatives"],
        grammar_notes=result.get("grammar_notes"),
        cultural_notes=result.get("cultural_notes")
    )

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {
        "languages": settings.SUPPORTED_LANGUAGES,
        "language_codes": settings.LANGUAGE_CODES
    }

@router.post("/detect")
async def detect_language(text: str):
    """Detect the language of input text (simplified)"""
    # Simple detection based on character sets
    if any('\u4e00' <= char <= '\u9fff' for char in text):
        return {"detected_language": "Chinese", "confidence": 0.8}
    elif any('\u3040' <= char <= '\u309f' or '\u30a0' <= char <= '\u30ff' for char in text):
        return {"detected_language": "Japanese", "confidence": 0.9}
    elif any('\u0900' <= char <= '\u097f' for char in text):
        return {"detected_language": "Hindi", "confidence": 0.9}
    elif any('\u00c0' <= char <= '\u00ff' for char in text):
        # Could be French, German, Spanish
        if 'ñ' in text.lower():
            return {"detected_language": "Spanish", "confidence": 0.7}
        elif 'ß' in text.lower() or 'ü' in text.lower():
            return {"detected_language": "German", "confidence": 0.7}
        else:
            return {"detected_language": "French", "confidence": 0.6}
    else:
        return {"detected_language": "English", "confidence": 0.5}
