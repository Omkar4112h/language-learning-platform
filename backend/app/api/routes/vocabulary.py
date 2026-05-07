"""
Vocabulary Builder API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.session import LearningSession, SessionInteraction, SessionType
from app.models.vocabulary import VocabularyWord, UserVocabulary
from app.schemas.vocabulary import (
    VocabularyWordResponse, VocabularyQuizQuestion, VocabularyQuizAnswer,
    VocabularyQuizResult, VocabularySessionWords, UserVocabularyProgress
)
from app.services.vocabulary_service import VocabularyService
from app.services.gamification_service import GamificationService

router = APIRouter()

@router.get("/session-words", response_model=VocabularySessionWords)
async def get_session_words(
    language: str = None,
    level: str = None,
    count: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get vocabulary words for a learning session"""
    target_language = language or current_user.target_language
    target_level = level or current_user.current_level.value
    
    vocab_service = VocabularyService(db)
    words = vocab_service.get_session_words(target_language, target_level, count)

    # Ensure words exist in DB so the frontend receives real word IDs
    word_id_by_text = {}
    word_obj_by_text = {}
    for w in words:
        word_text = (w.get("word") or "").strip()
        if not word_text:
            continue

        existing = db.query(VocabularyWord).filter(
            VocabularyWord.word == word_text,
            VocabularyWord.language == target_language,
            VocabularyWord.difficulty_level == target_level,
        ).first()

        if not existing:
            existing = VocabularyWord(
                word=word_text,
                language=target_language,
                difficulty_level=target_level,
                meaning=w.get("meaning") or "",
                example_sentence=w.get("example") or "",
                pronunciation=None,
                part_of_speech=w.get("pos"),
                synonyms=w.get("synonyms"),
                antonyms=None,
                category=w.get("category"),
            )
            db.add(existing)
            db.flush()  # assign PK without committing

        word_id_by_text[word_text.lower()] = existing.id
        word_obj_by_text[word_text.lower()] = existing
    
    # Generate quiz
    quiz = vocab_service.generate_quiz(words)
    
    # Build ordered ORM list for response (avoids created_at=None schema violations)
    word_responses = []
    for w in words:
        word_text = (w.get("word") or "").strip().lower()
        word_obj = word_obj_by_text.get(word_text)
        if word_obj is not None:
            word_responses.append(word_obj)
    
    quiz_questions = []
    for q in quiz:
        q_word_text = (q.get("word") or "").strip()
        q_word_id = word_id_by_text.get(q_word_text.lower(), 0)
        quiz_questions.append(VocabularyQuizQuestion(
            word_id=q_word_id,
            word=q_word_text,
            question_type=q["question_type"],
            question=q["question"],
            options=q["options"],
            correct_answer=q["correct_answer"]
        ))

    db.commit()
    
    return VocabularySessionWords(words=word_responses, quiz=quiz_questions)

@router.post("/check-answer", response_model=VocabularyQuizResult)
async def check_quiz_answer(
    answer: VocabularyQuizAnswer,
    correct_answer: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check vocabulary quiz answer"""
    vocab_service = VocabularyService(db)
    
    # Get word from database if it exists
    word = db.query(VocabularyWord).filter(VocabularyWord.id == answer.word_id).first()
    if not word and answer.word:
        word_text = answer.word.strip()
        if word_text:
            resolved_language = answer.language or current_user.target_language
            resolved_level = answer.difficulty_level or current_user.current_level.value
            word = db.query(VocabularyWord).filter(
                VocabularyWord.word == word_text,
                VocabularyWord.language == resolved_language,
                VocabularyWord.difficulty_level == resolved_level,
            ).first()
            if not word:
                word = VocabularyWord(
                    word=word_text,
                    language=resolved_language,
                    difficulty_level=resolved_level,
                    meaning=correct_answer or "",
                    example_sentence="",
                    pronunciation=None,
                    part_of_speech=None,
                    synonyms=None,
                    antonyms=None,
                    category=None,
                )
                db.add(word)
                db.flush()
    word_text = word.word if word else "unknown"
    
    # Check answer
    is_correct = answer.user_answer.lower().strip() == correct_answer.lower().strip()
    xp = 10 if is_correct else 0
    
    # Update user vocabulary progress if word exists in DB
    if word:
        vocab_service.update_user_vocabulary(current_user.id, word.id, is_correct)

        # Keep in sync with /users/stats/summary: words_learned = unique practiced words.
        current_user.words_learned = db.query(UserVocabulary).filter(
            UserVocabulary.user_id == current_user.id,
            UserVocabulary.times_practiced > 0,
        ).count()
    
    # Check for active vocabulary session
    active_session = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.ended_at == None,
        LearningSession.session_type == SessionType.VOCABULARY
    ).first()
    
    # Always update user XP regardless of session
    gamification = GamificationService(db)
    gamification.update_user_xp(current_user, xp)
    
    if active_session:
        if is_correct:
            active_session.correct_answers += 1
            active_session.current_streak += 1
        else:
            active_session.wrong_answers += 1
            active_session.current_streak = 0
        
        active_session.xp_earned += xp
    
    db.commit()
    
    return VocabularyQuizResult(
        word_id=answer.word_id,
        word=word_text,
        is_correct=is_correct,
        correct_answer=correct_answer,
        user_answer=answer.user_answer,
        xp_earned=xp
    )

@router.get("/learned", response_model=List[UserVocabularyProgress])
async def get_learned_vocabulary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's learned vocabulary"""
    user_vocab = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == current_user.id
    ).all()
    
    result = []
    for uv in user_vocab:
        word = uv.vocabulary_word
        result.append(UserVocabularyProgress(
            word_id=word.id,
            word=word.word,
            is_learned=uv.is_learned,
            times_practiced=uv.times_practiced,
            correct_count=uv.correct_count,
            wrong_count=uv.wrong_count,
            mastery_level=uv.mastery_level,
            first_seen=uv.first_seen,
            last_practiced=uv.last_practiced
        ))
    
    return result

@router.get("/stats")
async def get_vocabulary_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get vocabulary learning statistics"""
    user_vocab = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == current_user.id
    ).all()
    
    total_words = len(user_vocab)
    learned_words = sum(1 for v in user_vocab if v.is_learned)
    mastered_words = sum(1 for v in user_vocab if v.mastery_level >= 4)
    
    total_correct = sum(v.correct_count for v in user_vocab)
    total_wrong = sum(v.wrong_count for v in user_vocab)
    total_practice = total_correct + total_wrong
    
    accuracy = (total_correct / total_practice * 100) if total_practice > 0 else 0
    
    return {
        "total_words_seen": total_words,
        "words_learned": learned_words,
        "words_mastered": mastered_words,
        "total_practice_attempts": total_practice,
        "correct_answers": total_correct,
        "wrong_answers": total_wrong,
        "accuracy": round(accuracy, 2)
    }

@router.get("/words-by-category")
async def get_words_by_category(
    language: str = None,
    level: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get vocabulary words organized by category"""
    target_language = language or current_user.target_language
    target_level = level or current_user.current_level.value
    
    vocab_service = VocabularyService(db)
    all_words = vocab_service.VOCABULARY_BANK.get(target_language, {}).get(target_level, [])
    
    # Organize by category
    by_category = {}
    for word in all_words:
        category = word.get("category", "general")
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(word)
    
    return by_category
