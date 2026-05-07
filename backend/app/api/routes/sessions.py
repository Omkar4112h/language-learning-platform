"""
Learning Sessions API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.session import LearningSession, SessionInteraction, SessionType
from app.schemas.session import (
    SessionCreate, SessionResponse, SessionSummary, 
    SessionEnd, SessionInteractionCreate, SessionInteractionResponse
)
from app.services.gamification_service import GamificationService

router = APIRouter()


def _sync_user_session_counters(db: Session, user: User) -> None:
    """Recompute and persist derived user counters.

    This keeps `user.total_sessions` consistent even if the dashboard stats endpoint
    runs while a session is still active.
    """
    now = datetime.utcnow()
    min_duration_seconds = 30

    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == user.id,
    ).all()

    total_sessions = 0
    for session in sessions:
        answer_total = (
            (session.correct_answers or 0)
            + (session.partial_answers or 0)
            + (session.wrong_answers or 0)
        )

        duration_seconds = 0
        if session.started_at:
            end_time = session.ended_at or now
            duration_seconds = (end_time - session.started_at).total_seconds()

        if duration_seconds >= min_duration_seconds:
            total_sessions += 1

    correct = db.query(func.coalesce(func.sum(LearningSession.correct_answers), 0)).filter(
        LearningSession.user_id == user.id,
    ).scalar() or 0
    partial = db.query(func.coalesce(func.sum(LearningSession.partial_answers), 0)).filter(
        LearningSession.user_id == user.id,
    ).scalar() or 0
    wrong = db.query(func.coalesce(func.sum(LearningSession.wrong_answers), 0)).filter(
        LearningSession.user_id == user.id,
    ).scalar() or 0

    user.total_sessions = total_sessions
    user.total_correct_answers = int(correct) + int(partial)
    user.total_wrong_answers = int(wrong)
    db.commit()

@router.post("/start", response_model=SessionResponse)
async def start_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new learning session"""
    open_sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at == None,
    ).order_by(LearningSession.started_at.desc()).all()

    active_session = open_sessions[0] if open_sessions else None

    if active_session and active_session.session_type == session_data.session_type:
        answer_total = (
            (active_session.correct_answers or 0)
            + (active_session.partial_answers or 0)
            + (active_session.wrong_answers or 0)
        )
        # Avoid double-creating sessions in React StrictMode by reusing a very recent empty session.
        if answer_total == 0 and active_session.started_at and active_session.started_at > (datetime.utcnow() - timedelta(seconds=30)):
            return active_session

        # Otherwise, we'll close all open sessions before starting a new one.

    if open_sessions:
        # Close any previous open sessions so only one can be active.
        now = datetime.utcnow()
        for i, session in enumerate(open_sessions):
            # Only the most recent open session is considered "active".
            # Any additional open sessions are treated as phantom and closed
            # as zero-duration to prevent inflating dashboard counts.
            if i > 0:
                session.ended_at = session.started_at
                session.accuracy = 0.0
                continue

            answer_total = (
                (session.correct_answers or 0)
                + (session.partial_answers or 0)
                + (session.wrong_answers or 0)
            )
            if answer_total > 0:
                session.ended_at = now
                session.accuracy = session.calculate_accuracy()
            else:
                session.ended_at = session.started_at
                session.accuracy = 0.0

        db.commit()
        _sync_user_session_counters(db, current_user)

    # Create new session
    new_session = LearningSession(
        user_id=current_user.id,
        session_type=session_data.session_type,
        target_language=session_data.target_language,
        difficulty_level=session_data.difficulty_level
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Update streak
    gamification = GamificationService(db)
    gamification.update_streak(current_user)
    
    return new_session

@router.get("/active", response_model=SessionResponse)
async def get_active_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's active (not ended) session"""
    active_session = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at == None
    ).order_by(LearningSession.started_at.desc()).first()
    
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session found"
        )
    
    return active_session

@router.post("/{session_id}/end", response_model=SessionSummary)
async def end_session(
    session_id: str,
    session_end: SessionEnd = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End a learning session and get summary"""
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.ended_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session already ended"
        )
    
    # End the session
    session.ended_at = datetime.utcnow()
    session.accuracy = session.calculate_accuracy()
    
    if session_end and session_end.notes:
        session.notes = session_end.notes
    
    db.commit()
    _sync_user_session_counters(db, current_user)
    
    # Check for new badges
    gamification = GamificationService(db)
    new_badges = gamification.check_badges(current_user)
    badge_names = [b["name"] for b in new_badges]
    
    # Get session summary
    summary = gamification.get_session_summary(session, current_user)
    summary["badges_earned"] = badge_names
    
    return SessionSummary(**summary)

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get session details"""
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session

@router.get("/", response_model=List[SessionResponse])
async def get_user_sessions(
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's session history"""
    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id
    ).order_by(
        LearningSession.started_at.desc()
    ).offset(offset).limit(limit).all()
    
    return sessions

@router.get("/{session_id}/interactions", response_model=List[SessionInteractionResponse])
async def get_session_interactions(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all interactions for a session"""
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    interactions = db.query(SessionInteraction).filter(
        SessionInteraction.session_id == session.id
    ).order_by(SessionInteraction.created_at).all()
    
    return interactions

@router.post("/{session_id}/record-answer")
async def record_answer(
    session_id: str,
    is_correct: int,  # 0=wrong, 1=partial, 2=correct
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record an answer for the session"""
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at == None
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active session not found"
        )
    
    # Update session counts
    if is_correct == 2:
        session.correct_answers += 1
        session.current_streak += 1
    elif is_correct == 1:
        session.partial_answers += 1
        session.current_streak = 0
    else:
        session.wrong_answers += 1
        session.current_streak = 0
    
    # Calculate XP
    gamification = GamificationService(db)
    xp, streak_bonus = gamification.calculate_xp(is_correct, session.current_streak - 1)
    session.xp_earned += xp
    
    # Update user XP
    gamification.update_user_xp(current_user, xp)
    
    db.commit()
    
    return {
        "xp_earned": xp,
        "streak_bonus": streak_bonus,
        "current_streak": session.current_streak,
        "session_xp": session.xp_earned,
        "total_xp": current_user.total_xp
    }
