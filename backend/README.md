# Language Learning Platform - Backend

## Setup Instructions

### 1. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Download spaCy Language Models
```bash
python -m spacy download en_core_web_sm
python -m spacy download de_core_news_sm
python -m spacy download es_core_news_sm
python -m spacy download fr_core_news_sm
python -m spacy download ja_core_news_sm
```

### 4. Setup PostgreSQL Database
- Create a PostgreSQL database named `language_learning`
- Update `.env` with your database credentials

### 5. Configure Environment
```bash
copy .env.example .env
# Edit .env with your settings
```

### 6. Run the Server
```bash
uvicorn app.main:app --reload --port 8000
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Supported Languages
- English
- German
- Spanish
- Hindi
- French
- Japanese

### Level System (CEFR)
- A1 - Beginner (0-500 XP)
- A2 - Elementary (500-1000 XP)
- B1 - Intermediate (1000-2000 XP)
- B2 - Upper Intermediate (2000-3500 XP)
- C1 - Advanced (3500-5000 XP)
- C2 - Proficient (5000+ XP)
