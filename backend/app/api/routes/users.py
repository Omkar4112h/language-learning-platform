"""
User API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.models.user import User, UserLevel
from app.models.session import LearningSession
from app.models.vocabulary import UserVocabulary
from app.schemas.user import UserUpdate, UserResponse, UserDetailResponse, UserProgress
from app.services.gamification_service import GamificationService

router = APIRouter()

@router.get("/profile", response_model=UserDetailResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user's detailed profile"""
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    if user_update.target_language is not None:
        from app.core.config import settings
        if user_update.target_language not in settings.SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported language"
            )
        current_user.target_language = user_update.target_language
    
    if user_update.native_language is not None:
        current_user.native_language = user_update.native_language
    
    if user_update.current_level is not None:
        current_user.current_level = user_update.current_level
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/progress", response_model=UserProgress)
async def get_progress(current_user: User = Depends(get_current_user)):
    """Get user's learning progress"""
    return UserProgress(
        total_xp=current_user.total_xp,
        daily_streak=current_user.daily_streak,
        longest_streak=current_user.longest_streak,
        total_sessions=current_user.total_sessions,
        total_correct_answers=current_user.total_correct_answers,
        total_wrong_answers=current_user.total_wrong_answers,
        words_learned=current_user.words_learned,
        accuracy=current_user.calculate_accuracy(),
        current_level=current_user.current_level.value,
        next_level=current_user.get_next_level(),
        xp_for_next_level=current_user.xp_for_next_level()
    )

@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get XP leaderboard"""
    gamification = GamificationService(db)
    leaderboard = gamification.get_leaderboard(limit)
    
    # Find current user's rank
    all_users = db.query(User).order_by(User.total_xp.desc()).all()
    user_rank = next(
        (idx + 1 for idx, u in enumerate(all_users) if u.id == current_user.id),
        None
    )
    
    return {
        "leaderboard": leaderboard,
        "user_rank": user_rank,
        "user_xp": current_user.total_xp
    }

@router.get("/stats/summary")
async def get_stats_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get summary statistics for user"""
    ended_sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at.isnot(None),
    ).all()

    open_sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at.is_(None),
    ).order_by(LearningSession.started_at.desc()).all()

    # If multiple open sessions exist (common when the frontend fails to call /end
    # or React StrictMode double-invokes), keep only the latest as "active".
    # Older open sessions with no answers are closed as zero-duration so they don't
    # blow up the dashboard count.
    latest_open = open_sessions[0] if open_sessions else None
    extra_open = open_sessions[1:] if len(open_sessions) > 1 else []

    now = datetime.utcnow()
    did_cleanup = False
    for session in extra_open:
        # Close as zero-duration to avoid counting phantom sessions.
        session.ended_at = session.started_at
        session.accuracy = 0.0
        did_cleanup = True

    if did_cleanup:
        db.commit()

    # Count a session only when it represents a "real visit":
    # - user stayed on the page for >= 30 seconds.
    min_duration_seconds = 30
    total_sessions = 0
    for session in ended_sessions:
        duration_seconds = 0
        if session.started_at and session.ended_at:
            duration_seconds = (session.ended_at - session.started_at).total_seconds()

        if duration_seconds >= min_duration_seconds:
            total_sessions += 1

    # Count at most one active session (the latest open one).
    if latest_open and latest_open.started_at:
        latest_duration_seconds = (now - latest_open.started_at).total_seconds()
        if latest_duration_seconds >= min_duration_seconds:
            total_sessions += 1
    correct = db.query(func.coalesce(func.sum(LearningSession.correct_answers), 0)).filter(
        LearningSession.user_id == current_user.id,
    ).scalar() or 0
    partial = db.query(func.coalesce(func.sum(LearningSession.partial_answers), 0)).filter(
        LearningSession.user_id == current_user.id,
    ).scalar() or 0
    wrong = db.query(func.coalesce(func.sum(LearningSession.wrong_answers), 0)).filter(
        LearningSession.user_id == current_user.id,
    ).scalar() or 0

    correct_total = int(correct) + int(partial)
    wrong_total = int(wrong)
    total_answers = correct_total + wrong_total
    accuracy = round((correct_total / total_answers) * 100, 2) if total_answers else 0.0

    # "Words Learned" on the dashboard should reflect progress users can see
    # immediately: unique words practiced at least once.
    words_practiced = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == current_user.id,
        func.coalesce(UserVocabulary.times_practiced, 0) > 0,
    ).count()
    words_correct_once = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == current_user.id,
        func.coalesce(UserVocabulary.correct_count, 0) > 0,
    ).count()
    words_mastered = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == current_user.id,
        UserVocabulary.is_learned == True,
    ).count()

    # Backfill stored counters for consistency across the app (dashboard, certificates).
    current_user.total_sessions = total_sessions
    current_user.total_correct_answers = correct_total
    current_user.total_wrong_answers = wrong_total
    current_user.words_learned = words_practiced
    db.commit()
    
    return {
        "total_xp": current_user.total_xp,
        "current_level": current_user.current_level.value,
        "daily_streak": current_user.daily_streak,
        "longest_streak": current_user.longest_streak,
        "total_sessions": total_sessions,
        "total_answers": total_answers,
        "correct_answers": correct_total,
        "accuracy": accuracy,
        "words_learned": words_practiced,
        "words_correct_once": words_correct_once,
        "words_mastered": words_mastered,
        "target_language": current_user.target_language,
        "member_since": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate user account"""
    current_user.is_active = False
    db.commit()
    
    return {"message": "Account has been deactivated"}
