"""Reset a LangLearn user password from CLI.

Usage:
  python reset_user_password.py --identifier user@example.com --new-password NewPass123
"""

import argparse
import sys

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.session import LearningSession, SessionInteraction  # noqa: F401
from app.models.vocabulary import VocabularyWord, UserVocabulary  # noqa: F401
from app.models.badge import Badge, UserBadge  # noqa: F401
from app.models.certificate import Certificate  # noqa: F401


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset user password")
    parser.add_argument("--identifier", required=True, help="User email or username")
    parser.add_argument("--new-password", required=True, help="New plaintext password")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter((User.email == args.identifier) | (User.username == args.identifier))
            .first()
        )

        if not user:
            print(f"User not found for identifier: {args.identifier}")
            return 1

        user.hashed_password = get_password_hash(args.new_password)
        db.add(user)
        db.commit()
        print(f"Password updated successfully for: {user.email}")
        return 0
    except Exception as exc:
        db.rollback()
        print(f"Password reset failed: {exc}")
        return 2
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())