"""
AI-Powered Language Learning Platform
Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.models.user import User
from app.api.routes import auth, users, sessions, vocabulary, translation, correction, conversation, certificates, badges, games, missions
from app.core.database import Base, engine
from fastapi import FastAPI
from app.api.routes.ai import router as ai_router
import app.models.user
import app.models.session
import app.models.vocabulary
import app.models.badge
import app.models.certificate



Base.metadata.create_all(bind=engine)

# Create all database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown

app = FastAPI(
    title="Language Learning Platform",
    description="AI-powered language learning with gamification, NLP, and certification",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(ai_router, prefix="/api/ai", tags=["AI"])

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://language-learning-platform-m0p0ictxy-omkar4112hs-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Learning Sessions"])
app.include_router(vocabulary.router, prefix="/api/vocabulary", tags=["Vocabulary Builder"])
app.include_router(translation.router, prefix="/api/translation", tags=["Translation"])
app.include_router(correction.router, prefix="/api/correction", tags=["Sentence Correction"])
app.include_router(conversation.router, prefix="/api/conversation", tags=["Conversation Practice"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(badges.router, prefix="/api/badges", tags=["Badges"])
app.include_router(games.router, prefix="/api/games", tags=["Games"])
app.include_router(missions.router, prefix="/api/missions", tags=["Missions"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Language Learning Platform API",
        "docs": "/docs",
        "supported_languages": ["English", "German", "Spanish", "Hindi", "French", "Japanese"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
