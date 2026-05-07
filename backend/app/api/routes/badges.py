"""
Badge API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.badge import Badge, UserBadge, DEFAULT_BADGES
from app.schemas.badge import BadgeResponse, UserBadgeResponse, BadgeUnlockNotification
from app.services.gamification_service import GamificationService

router = APIRouter()

@router.get("/all", response_model=List[BadgeResponse])
async def get_all_badges(db: Session = Depends(get_db)):
    """Get all available badges"""
    # Ensure badges exist
    gamification = GamificationService(db)
    gamification._ensure_badges_exist()
    
    badges = db.query(Badge).all()
    return badges

@router.get("/my-badges", response_model=List[UserBadgeResponse])
async def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's earned badges"""
    user_badges = db.query(UserBadge).filter(
        UserBadge.user_id == current_user.id
    ).all()
    
    return user_badges

@router.get("/check-new")
async def check_new_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check for any newly earned badges"""
    gamification = GamificationService(db)
    new_badges = gamification.check_badges(current_user)
    
    return {
        "new_badges": new_badges,
        "count": len(new_badges)
    }

@router.get("/progress")
async def get_badge_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress towards all badges"""
    # Ensure badges exist
    gamification = GamificationService(db)
    gamification._ensure_badges_exist()
    
    all_badges = db.query(Badge).all()
    user_badge_ids = [ub.badge_id for ub in current_user.badges]
    
    progress = []
    for badge in all_badges:
        is_earned = badge.id in user_badge_ids
        current_progress = 0
        
        # Calculate progress
        if badge.requirement_type == "corrections":
            current_progress = current_user.total_correct_answers
        elif badge.requirement_type == "streak":
            current_progress = current_user.daily_streak
        elif badge.requirement_type == "vocabulary":
            current_progress = current_user.words_learned
        elif badge.requirement_type == "accuracy":
            current_progress = int(current_user.calculate_accuracy())
        elif badge.requirement_type == "sessions":
            current_progress = current_user.total_sessions
        elif badge.requirement_type == "level":
            levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
            current_progress = levels.index(current_user.current_level.value)
        
        progress.append({
            "badge_id": badge.id,
            "name": badge.name,
            "icon": badge.icon,
            "description": badge.description,
            "requirement_type": badge.requirement_type,
            "requirement_value": badge.requirement_value,
            "current_progress": current_progress,
            "percentage": min(100, int((current_progress / badge.requirement_value) * 100)),
            "is_earned": is_earned,
            "rarity": badge.rarity
        })
    
    return progress

@router.get("/{badge_id}")
async def get_badge_details(
    badge_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific badge"""
    badge = db.query(Badge).filter(Badge.id == badge_id).first()
    
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found"
        )
    
    # Get count of users who have earned this badge
    earned_count = db.query(UserBadge).filter(UserBadge.badge_id == badge_id).count()
    
    return {
        "badge": BadgeResponse.model_validate(badge),
        "users_earned": earned_count
    }
