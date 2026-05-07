"""
Sentence Correction API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.session import LearningSession, SessionInteraction, SessionType
from app.schemas.language import CorrectionRequest, CorrectionResponse
from app.services.nlp_service import GrammarCorrector
from app.services.gamification_service import GamificationService

router = APIRouter()

@router.post("/check", response_model=CorrectionResponse)
async def check_sentence(
    request: CorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check and correct a sentence"""
    # Initialize corrector
    corrector = GrammarCorrector(request.target_language)
    
    # Correct the sentence
    result = corrector.correct_sentence(request.sentence)
    
    # Calculate XP based on score
    if result["score"] >= 90:
        is_correct = 2  # Correct
        xp = 10
    elif result["score"] >= 60:
        is_correct = 1  # Partial
        xp = 5
    else:
        is_correct = 0  # Wrong
        xp = 0
    
    # Generate explanation
    if result["errors"]:
        explanations = [e["explanation"] for e in result["errors"]]
        explanation = " ".join(explanations)
    else:
        explanation = "Great job! Your sentence is grammatically correct."
    
    # Generate rule summary
    if result["errors"]:
        rules = list(set([e["type"] for e in result["errors"]]))
        rule_summary = f"Areas to review: {', '.join(rules)}"
    else:
        rule_summary = "All grammar rules followed correctly!"
    
    # Check for active session and record
    active_session = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at == None,
        LearningSession.session_type == SessionType.CORRECTION
    ).first()
    
    # Always award XP for correction practice
    gamification = GamificationService(db)
    gamification.update_user_xp(current_user, xp)
    
    if active_session:
        # Record interaction
        interaction = SessionInteraction(
            session_id=active_session.id,
            user_input=request.sentence,
            ai_response=result["corrected"],
            is_correct=is_correct,
            xp_awarded=xp,
            feedback=explanation
        )
        db.add(interaction)
        
        # Update session stats
        if is_correct == 2:
            active_session.correct_answers += 1
            active_session.current_streak += 1
        elif is_correct == 1:
            active_session.partial_answers += 1
        else:
            active_session.wrong_answers += 1
            active_session.current_streak = 0
        
        active_session.xp_earned += xp
    
    db.commit()
    
    return CorrectionResponse(
        original_sentence=result["original"],
        corrected_sentence=result["corrected"],
        has_errors=result["has_errors"],
        errors=result["errors"],
        explanation=explanation,
        rule_summary=rule_summary,
        alternative_sentence=result["alternative"],
        score=result["score"],
        xp_earned=xp
    )

@router.post("/quick-check")
async def quick_check(
    sentence: str,
    language: str = "English"
):
    """Quick grammar check without authentication (limited features)"""
    corrector = GrammarCorrector(language)
    result = corrector.correct_sentence(sentence)
    
    return {
        "original": result["original"],
        "corrected": result["corrected"],
        "has_errors": result["has_errors"],
        "error_count": len(result["errors"])
    }
