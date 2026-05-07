# LangLearn - Frontend

AI-Powered Language Learning Platform - React Frontend

## Prerequisites

- Node.js 16+ 
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will run on `http://localhost:3000`

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.js
│   │   └── layout/
│   │       ├── Layout.js
│   │       └── Layout.css
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Home.js/css
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Auth.css
│   │   ├── Dashboard.js/css
│   │   ├── SentenceCorrection.js
│   │   ├── Translation.js
│   │   ├── Conversation.js/css
│   │   ├── VocabularyBuilder.js/css
│   │   ├── Profile.js/css
│   │   ├── Badges.js/css
│   │   ├── Certificates.js/css
│   │   ├── Leaderboard.js/css
│   │   ├── SessionHistory.js/css
│   │   └── FeaturePage.css
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
└── package.json
```

## Features

### Pages

1. **Home** - Landing page with features overview
2. **Login/Register** - Authentication pages
3. **Dashboard** - User stats, XP progress, quick actions
4. **Sentence Correction** - Grammar checking with AI feedback
5. **Translation** - Multi-language translation
6. **Conversation** - AI roleplay scenarios
7. **Vocabulary Builder** - Flashcards and quizzes
8. **Profile** - User settings and stats
9. **Badges** - Achievement collection
10. **Certificates** - Generate level certificates
11. **Leaderboard** - Global rankings
12. **Session History** - Past learning sessions

### Key Components

- **AuthContext** - Global authentication state
- **ProtectedRoute** - Route guard for authenticated pages
- **Layout** - Sidebar navigation for logged-in users

### API Service

All API calls are centralized in `services/api.js`:
- Auth endpoints (login, register, logout)
- User endpoints (profile, progress, leaderboard)
- Session endpoints (start, end, record answers)
- Feature endpoints (correction, translation, conversation, vocabulary)
- Gamification endpoints (badges, certificates)

## Environment

Make sure the backend is running on `http://localhost:8000`

API base URL behavior:
- Default (recommended for local dev): uses `'/api'` and `package.json` proxy to reach backend.
- Optional: set `REACT_APP_API_URL` (see `.env.example`) to call backend directly, e.g. `http://localhost:8000/api`.

## Available Scripts

```bash
npm start       # Start development server
npm build       # Build for production
npm test        # Run tests
npm eject       # Eject from CRA
```

## Technologies

- React 18
- React Router v6
- Axios
- React Toastify
- React Icons
- Recharts (for charts)
