"""
XP and Gamification Service

Manages XP calculations, streaks, level progression, and badge awards
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta

from app.models.user import User, UserLevel
from app.models.badge import Badge, UserBadge, DEFAULT_BADGES
from app.models.session import LearningSession
from app.core.config import settings

class GamificationService:
    """Service for gamification features"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_xp(self, is_correct: int, current_streak: int) -> Tuple[int, bool]:
        """
        Calculate XP for an answer
        Returns: (xp_earned, streak_bonus_applied)
        """
        streak_bonus = False
        
        if is_correct == 2:  # Correct
            xp = settings.XP_CORRECT
        elif is_correct == 1:  # Partial
            xp = settings.XP_PARTIAL
        else:  # Wrong
            xp = settings.XP_WRONG
        
        # Apply streak bonus for every 5 correct answers
        if is_correct == 2 and (current_streak + 1) % 5 == 0:
            xp += settings.XP_STREAK_BONUS
            streak_bonus = True
        
        return xp, streak_bonus
    
    def update_user_xp(self, user: User, xp_earned: int) -> Dict:
        """Update user's XP and check for level up"""
        old_level = user.current_level.value
        user.total_xp += xp_earned
        
        # Check for level up
        new_level = self._calculate_level(user.total_xp)
        level_up = False
        
        if new_level != old_level:
            user.current_level = UserLevel(new_level)
            level_up = True
        
        self.db.commit()
        
        return {
            "old_level": old_level,
            "new_level": new_level,
            "level_up": level_up,
            "total_xp": user.total_xp,
            "xp_for_next_level": self._xp_for_next_level(new_level)
        }
    
    def _calculate_level(self, total_xp: int) -> str:
        """Calculate user level based on total XP"""
        thresholds = settings.LEVEL_XP_THRESHOLDS
        
        if total_xp >= thresholds["C2"]:
            return "C2"
        elif total_xp >= thresholds["C1"]:
            return "C1"
        elif total_xp >= thresholds["B2"]:
            return "B2"
        elif total_xp >= thresholds["B1"]:
            return "B1"
        elif total_xp >= thresholds["A2"]:
            return "A2"
        else:
            return "A1"
    
    def _xp_for_next_level(self, current_level: str) -> int:
        """Get XP required for next level"""
        levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
        current_idx = levels.index(current_level)
        
        if current_idx < len(levels) - 1:
            next_level = levels[current_idx + 1]
            return settings.LEVEL_XP_THRESHOLDS[next_level]
        
        return settings.LEVEL_XP_THRESHOLDS["C2"]
    
    def update_streak(self, user: User) -> Dict:
        """Update user's daily streak"""
        today = datetime.utcnow().date()
        
        if user.last_activity_date:
            last_date = user.last_activity_date.date()
            days_diff = (today - last_date).days
            
            if days_diff == 0:
                # Same day, no streak change
                pass
            elif days_diff == 1:
                # Next day - increase streak
                user.daily_streak += 1
                if user.daily_streak > user.longest_streak:
                    user.longest_streak = user.daily_streak
            else:
                # Missed days - reset streak
                user.daily_streak = 1
        else:
            # First activity
            user.daily_streak = 1
        
        user.last_activity_date = datetime.utcnow()
        self.db.commit()
        
        return {
            "daily_streak": user.daily_streak,
            "longest_streak": user.longest_streak,
            "streak_maintained": True
        }
    
    def check_badges(self, user: User) -> List[Dict]:
        """Check and award badges based on user's achievements"""
        new_badges = []
        
        # Ensure badges exist in database
        self._ensure_badges_exist()
        
        # Get all badges user doesn't have
        user_badge_ids = [ub.badge_id for ub in user.badges]
        available_badges = self.db.query(Badge).filter(
            ~Badge.id.in_(user_badge_ids) if user_badge_ids else True
        ).all()
        
        for badge in available_badges:
            if self._check_badge_requirement(user, badge):
                # Award badge
                user_badge = UserBadge(user_id=user.id, badge_id=badge.id)
                self.db.add(user_badge)
                
                # Award bonus XP
                user.total_xp += badge.xp_bonus
                
                new_badges.append({
                    "name": badge.name,
                    "icon": badge.icon,
                    "description": badge.description,
                    "xp_bonus": badge.xp_bonus,
                    "message": f"🎉 Congratulations! You've earned the '{badge.name}' badge!"
                })
        
        if new_badges:
            self.db.commit()
        
        return new_badges
    
    def _check_badge_requirement(self, user: User, badge: Badge) -> bool:
        """Check if user meets badge requirements"""
        req_type = badge.requirement_type
        req_value = badge.requirement_value
        
        if req_type == "corrections":
            return user.total_correct_answers >= req_value
        elif req_type == "streak":
            return user.daily_streak >= req_value
        elif req_type == "vocabulary":
            return user.words_learned >= req_value
        elif req_type == "accuracy":
            accuracy = user.calculate_accuracy()
            return accuracy >= req_value
        elif req_type == "sessions":
            return user.total_sessions >= req_value
        elif req_type == "level":
            levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
            user_level_idx = levels.index(user.current_level.value)
            return user_level_idx >= req_value
        
        return False
    
    def _ensure_badges_exist(self):
        """Ensure default badges exist in database"""
        existing_badges = self.db.query(Badge.name).all()
        existing_names = [b.name for b in existing_badges]
        
        for badge_data in DEFAULT_BADGES:
            if badge_data["name"] not in existing_names:
                badge = Badge(**badge_data)
                self.db.add(badge)
        
        self.db.commit()
    
    def get_user_badges(self, user_id: int) -> List[Dict]:
        """Get all badges for a user"""
        user_badges = self.db.query(UserBadge).filter(
            UserBadge.user_id == user_id
        ).all()
        
        return [
            {
                "id": ub.badge.id,
                "name": ub.badge.name,
                "icon": ub.badge.icon,
                "description": ub.badge.description,
                "earned_at": ub.earned_at.isoformat(),
                "rarity": ub.badge.rarity
            }
            for ub in user_badges
        ]
    
    def get_session_summary(self, session: LearningSession, user: User) -> Dict:
        """Generate session summary"""
        accuracy = session.calculate_accuracy()
        motivational = session.get_motivational_message()
        
        return {
            "session_id": session.session_id,
            "correct_answers": session.correct_answers,
            "wrong_answers": session.wrong_answers,
            "partial_answers": session.partial_answers,
            "accuracy": accuracy,
            "xp_earned": session.xp_earned,
            "total_user_xp": user.total_xp,
            "current_level": user.current_level.value,
            "next_level_xp_required": self._xp_for_next_level(user.current_level.value),
            "motivational_message": motivational,
            "daily_streak": user.daily_streak
        }
    
    def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """Get XP leaderboard"""
        top_users = self.db.query(User).order_by(
            User.total_xp.desc()
        ).limit(limit).all()
        
        return [
            {
                "rank": idx + 1,
                "username": user.username,
                "total_xp": user.total_xp,
                "level": user.current_level.value,
                "streak": user.daily_streak
            }
            for idx, user in enumerate(top_users)
        ]
