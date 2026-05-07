# LangLearn - AI-Powered Language Learning Platform

A full-stack language learning application with AI-powered features, gamification, and certification system.

## Overview

LangLearn helps users learn 6 languages (English, German, Spanish, Hindi, French, Japanese) through:
- **Sentence Correction** - Grammar and vocabulary feedback
- **Translation** - Multi-language translation
- **Conversation Practice** - AI roleplay scenarios
- **Vocabulary Builder** - Flashcards and quizzes

## Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **spaCy** - NLP processing
- **ReportLab** - PDF certificate generation
- **JWT** - Authentication

### Frontend
- **React 18** - UI library
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **React Toastify** - Notifications

## Project Structure

```
new proj/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── core/            # Config, security, database
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── main.py          # FastAPI app
│   ├── certificates/        # Generated PDFs
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # Context providers
│   │   ├── pages/           # Page components
│   │   └── services/        # API service
│   ├── package.json
│   └── README.md
└── README.md
```

## Quick Start

### 1. Database Setup

```sql
CREATE DATABASE langlearn;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Download spaCy models
python -m spacy download en_core_web_sm

# Create .env file
copy .env.example .env
# Edit .env with your database credentials

# Run server
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs on `http://localhost:3000`

## Features

### Learning Modes
| Mode | Description |
|------|-------------|
| Sentence Correction | Write sentences, get grammar feedback with corrections |
| Translation | Translate between 6 languages |
| Conversation | Practice scenarios (restaurant, hotel, shopping, etc.) |
| Vocabulary | Learn words with flashcards and quizzes |

### Gamification
- **XP System**: Earn XP for correct answers
  - Correct: +10 XP
  - Partial: +5 XP
  - Streak Bonus: +20 XP every 5 correct
- **Levels**: A1 → A2 → B1 → B2 → C1 → C2 (CEFR-based)
- **Daily Streaks**: Maintain learning consistency
- **Badges**: Unlock achievements
- **Certificates**: Generate PDF certificates per level

### Level Thresholds
| Level | XP Required |
|-------|-------------|
| A1 | 0 |
| A2 | 500 |
| B1 | 1000 |
| B2 | 2000 |
| C1 | 3500 |
| C2 | 5000 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (form data)
- `POST /api/auth/login/json` - Login (JSON)
- `GET /api/auth/me` - Current user

### Learning
- `POST /api/correction/check` - Check sentence grammar
- `POST /api/translation/translate` - Translate text
- `POST /api/conversation/message` - Chat with AI
- `GET /api/vocabulary/session-words` - Get vocabulary words
- `POST /api/vocabulary/check-answer` - Check vocabulary answer

### Gamification
- `GET /api/badges/my-badges` - User's badges
- `GET /api/certificates/eligibility` - Check certificate eligibility
- `POST /api/certificates/generate/{level}` - Generate certificate
- `GET /api/users/leaderboard` - Global leaderboard

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost/langlearn
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## License

MIT License
