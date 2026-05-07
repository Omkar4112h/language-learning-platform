"""
Vocabulary Service

Manages vocabulary words, learning progress, and quizzes
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import random

from app.models.vocabulary import VocabularyWord, UserVocabulary
from app.models.user import User
from app.core.config import settings

class VocabularyService:
    """Service for vocabulary management and learning"""
    
    # Vocabulary bank organized by language and level
    VOCABULARY_BANK = {
        "English": {
            "A1": [
                {"word": "hello", "meaning": "A greeting used when meeting someone", "example": "Hello! How are you today?", "pos": "interjection", "synonyms": "hi, hey", "category": "greetings"},
                {"word": "book", "meaning": "A written or printed work consisting of pages", "example": "I love reading this book.", "pos": "noun", "synonyms": "volume, text", "category": "objects"},
                {"word": "eat", "meaning": "To consume food", "example": "I eat breakfast every morning.", "pos": "verb", "synonyms": "consume, dine", "category": "actions"},
                {"word": "happy", "meaning": "Feeling or showing pleasure", "example": "She is very happy today.", "pos": "adjective", "synonyms": "joyful, pleased", "category": "emotions"},
                {"word": "water", "meaning": "A clear liquid essential for life", "example": "Please drink more water.", "pos": "noun", "synonyms": "H2O, aqua", "category": "essentials"},
                {"word": "friend", "meaning": "A person with whom one has a bond of mutual affection", "example": "She is my best friend.", "pos": "noun", "synonyms": "companion, buddy", "category": "relationships"},
                {"word": "house", "meaning": "A building for human habitation", "example": "My house has three bedrooms.", "pos": "noun", "synonyms": "home, residence", "category": "places"},
                {"word": "work", "meaning": "Activity involving effort done to achieve a result", "example": "I go to work every day.", "pos": "noun/verb", "synonyms": "job, labor", "category": "activities"},
                {"word": "good", "meaning": "Of a high quality or standard", "example": "This is a good idea.", "pos": "adjective", "synonyms": "great, excellent", "category": "descriptions"},
                {"word": "day", "meaning": "A period of 24 hours", "example": "Have a nice day!", "pos": "noun", "synonyms": "date, daytime", "category": "time"},
            ],
            "A2": [
                {"word": "beautiful", "meaning": "Pleasing to the senses or mind aesthetically", "example": "The sunset is beautiful.", "pos": "adjective", "synonyms": "gorgeous, lovely", "category": "descriptions"},
                {"word": "understand", "meaning": "To perceive the meaning of", "example": "I understand your point.", "pos": "verb", "synonyms": "comprehend, grasp", "category": "mental actions"},
                {"word": "restaurant", "meaning": "A place where people pay to eat meals", "example": "Let's go to the restaurant.", "pos": "noun", "synonyms": "eatery, diner", "category": "places"},
                {"word": "weather", "meaning": "The state of the atmosphere", "example": "The weather is nice today.", "pos": "noun", "synonyms": "climate, conditions", "category": "nature"},
                {"word": "important", "meaning": "Of great significance or value", "example": "This meeting is important.", "pos": "adjective", "synonyms": "significant, crucial", "category": "descriptions"},
                {"word": "remember", "meaning": "To have in your mind", "example": "I remember that day.", "pos": "verb", "synonyms": "recall, recollect", "category": "mental actions"},
                {"word": "different", "meaning": "Not the same as another", "example": "They have different opinions.", "pos": "adjective", "synonyms": "distinct, various", "category": "descriptions"},
                {"word": "quickly", "meaning": "At a fast speed", "example": "She ran quickly to catch the bus.", "pos": "adverb", "synonyms": "rapidly, swiftly", "category": "manner"},
                {"word": "problem", "meaning": "A matter that is difficult to deal with", "example": "We need to solve this problem.", "pos": "noun", "synonyms": "issue, difficulty", "category": "concepts"},
                {"word": "because", "meaning": "For the reason that", "example": "I stayed home because it rained.", "pos": "conjunction", "synonyms": "since, as", "category": "connectors"},
            ],
            "B1": [
                {"word": "opportunity", "meaning": "A favorable time or situation", "example": "This is a great opportunity for growth.", "pos": "noun", "synonyms": "chance, occasion", "category": "concepts"},
                {"word": "experience", "meaning": "Practical contact with events or activities", "example": "I have five years of experience.", "pos": "noun", "synonyms": "knowledge, expertise", "category": "professional"},
                {"word": "decision", "meaning": "A conclusion or resolution reached after consideration", "example": "We need to make a decision.", "pos": "noun", "synonyms": "choice, determination", "category": "concepts"},
                {"word": "environment", "meaning": "The surroundings or conditions of life", "example": "We must protect the environment.", "pos": "noun", "synonyms": "surroundings, setting", "category": "nature"},
                {"word": "develop", "meaning": "To grow or cause to grow", "example": "We plan to develop new products.", "pos": "verb", "synonyms": "advance, expand", "category": "actions"},
                {"word": "communicate", "meaning": "To share or exchange information", "example": "It's important to communicate clearly.", "pos": "verb", "synonyms": "convey, express", "category": "actions"},
                {"word": "achieve", "meaning": "To successfully reach a goal", "example": "She achieved her dream.", "pos": "verb", "synonyms": "accomplish, attain", "category": "actions"},
                {"word": "confident", "meaning": "Feeling or showing certainty", "example": "She felt confident about the exam.", "pos": "adjective", "synonyms": "assured, self-assured", "category": "emotions"},
                {"word": "situation", "meaning": "A set of circumstances", "example": "We're in a difficult situation.", "pos": "noun", "synonyms": "circumstance, condition", "category": "concepts"},
                {"word": "recommend", "meaning": "To suggest as good or suitable", "example": "I recommend this restaurant.", "pos": "verb", "synonyms": "suggest, advise", "category": "actions"},
            ],
            "B2": [
                {"word": "comprehensive", "meaning": "Complete and including everything necessary", "example": "This is a comprehensive guide.", "pos": "adjective", "synonyms": "thorough, complete", "category": "descriptions"},
                {"word": "significant", "meaning": "Sufficiently great or important", "example": "This is a significant improvement.", "pos": "adjective", "synonyms": "notable, substantial", "category": "descriptions"},
                {"word": "collaborate", "meaning": "To work jointly on an activity", "example": "We collaborate with other teams.", "pos": "verb", "synonyms": "cooperate, partner", "category": "professional"},
                {"word": "perspective", "meaning": "A particular way of viewing things", "example": "From my perspective, it's a good idea.", "pos": "noun", "synonyms": "viewpoint, outlook", "category": "concepts"},
                {"word": "implement", "meaning": "To put into effect", "example": "We will implement the new policy.", "pos": "verb", "synonyms": "execute, apply", "category": "professional"},
                {"word": "consequence", "meaning": "A result or effect of an action", "example": "Every action has consequences.", "pos": "noun", "synonyms": "result, outcome", "category": "concepts"},
                {"word": "maintain", "meaning": "To cause to continue", "example": "We must maintain high standards.", "pos": "verb", "synonyms": "preserve, sustain", "category": "actions"},
                {"word": "acknowledge", "meaning": "To accept or recognize", "example": "I acknowledge my mistake.", "pos": "verb", "synonyms": "admit, recognize", "category": "communication"},
                {"word": "efficient", "meaning": "Achieving maximum productivity", "example": "This process is very efficient.", "pos": "adjective", "synonyms": "effective, productive", "category": "descriptions"},
                {"word": "sophisticated", "meaning": "Highly developed and complex", "example": "It's a sophisticated system.", "pos": "adjective", "synonyms": "advanced, refined", "category": "descriptions"},
            ],
            "C1": [
                {"word": "ambiguous", "meaning": "Open to more than one interpretation", "example": "The statement was ambiguous.", "pos": "adjective", "synonyms": "unclear, vague", "category": "descriptions"},
                {"word": "paradigm", "meaning": "A typical example or pattern", "example": "This represents a new paradigm.", "pos": "noun", "synonyms": "model, standard", "category": "concepts"},
                {"word": "inevitable", "meaning": "Certain to happen", "example": "Change is inevitable.", "pos": "adjective", "synonyms": "unavoidable, certain", "category": "descriptions"},
                {"word": "meticulous", "meaning": "Showing great attention to detail", "example": "She is meticulous in her work.", "pos": "adjective", "synonyms": "thorough, precise", "category": "descriptions"},
                {"word": "reluctant", "meaning": "Unwilling and hesitant", "example": "He was reluctant to participate.", "pos": "adjective", "synonyms": "hesitant, unwilling", "category": "emotions"},
                {"word": "consolidate", "meaning": "To combine into a single unit", "example": "We need to consolidate our resources.", "pos": "verb", "synonyms": "merge, unify", "category": "professional"},
                {"word": "scrutinize", "meaning": "To examine closely and critically", "example": "They will scrutinize the report.", "pos": "verb", "synonyms": "examine, inspect", "category": "actions"},
                {"word": "unprecedented", "meaning": "Never done or known before", "example": "This is an unprecedented situation.", "pos": "adjective", "synonyms": "unparalleled, unique", "category": "descriptions"},
                {"word": "compelling", "meaning": "Evoking interest in a powerful way", "example": "She made a compelling argument.", "pos": "adjective", "synonyms": "convincing, powerful", "category": "descriptions"},
                {"word": "obsolete", "meaning": "No longer produced or used", "example": "The technology became obsolete.", "pos": "adjective", "synonyms": "outdated, antiquated", "category": "descriptions"},
            ],
            "C2": [
                {"word": "nuance", "meaning": "A subtle difference in meaning or expression", "example": "The nuances of the language are complex.", "pos": "noun", "synonyms": "subtlety, shade", "category": "concepts"},
                {"word": "ubiquitous", "meaning": "Present, appearing, or found everywhere", "example": "Smartphones are now ubiquitous.", "pos": "adjective", "synonyms": "omnipresent, pervasive", "category": "descriptions"},
                {"word": "ephemeral", "meaning": "Lasting for a very short time", "example": "Fame can be ephemeral.", "pos": "adjective", "synonyms": "fleeting, transient", "category": "descriptions"},
                {"word": "quintessential", "meaning": "Representing the most perfect example", "example": "It's the quintessential British experience.", "pos": "adjective", "synonyms": "typical, classic", "category": "descriptions"},
                {"word": "serendipity", "meaning": "The occurrence of fortunate events by chance", "example": "Finding that book was pure serendipity.", "pos": "noun", "synonyms": "luck, fortune", "category": "concepts"},
                {"word": "idiosyncratic", "meaning": "Peculiar to the individual", "example": "He has idiosyncratic habits.", "pos": "adjective", "synonyms": "distinctive, peculiar", "category": "descriptions"},
                {"word": "juxtapose", "meaning": "To place close together for contrasting effect", "example": "The artist juxtaposed colors beautifully.", "pos": "verb", "synonyms": "contrast, compare", "category": "actions"},
                {"word": "vicarious", "meaning": "Experienced through another person", "example": "She lived vicariously through her children.", "pos": "adjective", "synonyms": "indirect, secondary", "category": "emotions"},
                {"word": "enigmatic", "meaning": "Difficult to interpret or understand", "example": "She gave an enigmatic smile.", "pos": "adjective", "synonyms": "mysterious, puzzling", "category": "descriptions"},
                {"word": "sycophant", "meaning": "A person who acts to gain advantage", "example": "He was surrounded by sycophants.", "pos": "noun", "synonyms": "flatterer, toady", "category": "people"},
            ]
        },
        "German": {
            "A1": [
                {"word": "Hallo", "meaning": "Hello, a greeting", "example": "Hallo, wie geht es dir?", "pos": "interjection", "synonyms": "Grüß Gott, Servus", "category": "greetings"},
                {"word": "Danke", "meaning": "Thank you", "example": "Danke schön!", "pos": "interjection", "synonyms": "vielen Dank", "category": "greetings"},
                {"word": "Wasser", "meaning": "Water", "example": "Ich trinke Wasser.", "pos": "noun", "synonyms": "H2O", "category": "essentials"},
                {"word": "Buch", "meaning": "Book", "example": "Ich lese ein Buch.", "pos": "noun", "synonyms": "Lektüre", "category": "objects"},
                {"word": "gut", "meaning": "Good", "example": "Das ist sehr gut.", "pos": "adjective", "synonyms": "prima, toll", "category": "descriptions"},
            ],
            "A2": [
                {"word": "verstehen", "meaning": "To understand", "example": "Ich verstehe das nicht.", "pos": "verb", "synonyms": "begreifen", "category": "mental actions"},
                {"word": "arbeiten", "meaning": "To work", "example": "Ich arbeite jeden Tag.", "pos": "verb", "synonyms": "tätig sein", "category": "activities"},
                {"word": "wichtig", "meaning": "Important", "example": "Das ist sehr wichtig.", "pos": "adjective", "synonyms": "bedeutend", "category": "descriptions"},
                {"word": "Freund", "meaning": "Friend", "example": "Er ist mein bester Freund.", "pos": "noun", "synonyms": "Kamerad", "category": "relationships"},
                {"word": "schnell", "meaning": "Fast, quickly", "example": "Er läuft sehr schnell.", "pos": "adverb", "synonyms": "rasch", "category": "manner"},
            ]
        },
        "Spanish": {
            "A1": [
                {"word": "Hola", "meaning": "Hello", "example": "¡Hola! ¿Cómo estás?", "pos": "interjection", "synonyms": "Buenos días", "category": "greetings"},
                {"word": "Gracias", "meaning": "Thank you", "example": "Muchas gracias por tu ayuda.", "pos": "interjection", "synonyms": "Te lo agradezco", "category": "greetings"},
                {"word": "Agua", "meaning": "Water", "example": "Necesito un vaso de agua.", "pos": "noun", "synonyms": "H2O", "category": "essentials"},
                {"word": "Libro", "meaning": "Book", "example": "Estoy leyendo un libro.", "pos": "noun", "synonyms": "texto", "category": "objects"},
                {"word": "Bueno", "meaning": "Good", "example": "Este restaurante es muy bueno.", "pos": "adjective", "synonyms": "excelente", "category": "descriptions"},
            ],
            "A2": [
                {"word": "entender", "meaning": "To understand", "example": "No entiendo este problema.", "pos": "verb", "synonyms": "comprender", "category": "mental actions"},
                {"word": "trabajar", "meaning": "To work", "example": "Trabajo en una oficina.", "pos": "verb", "synonyms": "laborar", "category": "activities"},
                {"word": "importante", "meaning": "Important", "example": "Es muy importante estudiar.", "pos": "adjective", "synonyms": "significativo", "category": "descriptions"},
                {"word": "amigo", "meaning": "Friend", "example": "Él es mi mejor amigo.", "pos": "noun", "synonyms": "compañero", "category": "relationships"},
                {"word": "rápido", "meaning": "Fast", "example": "El tren es muy rápido.", "pos": "adjective", "synonyms": "veloz", "category": "descriptions"},
            ]
        },
        "French": {
            "A1": [
                {"word": "Bonjour", "meaning": "Hello, Good day", "example": "Bonjour! Comment allez-vous?", "pos": "interjection", "synonyms": "Salut", "category": "greetings"},
                {"word": "Merci", "meaning": "Thank you", "example": "Merci beaucoup!", "pos": "interjection", "synonyms": "Je vous remercie", "category": "greetings"},
                {"word": "Eau", "meaning": "Water", "example": "Je voudrais de l'eau, s'il vous plaît.", "pos": "noun", "synonyms": "H2O", "category": "essentials"},
                {"word": "Livre", "meaning": "Book", "example": "Je lis un livre.", "pos": "noun", "synonyms": "ouvrage", "category": "objects"},
                {"word": "Bon", "meaning": "Good", "example": "C'est très bon!", "pos": "adjective", "synonyms": "bien", "category": "descriptions"},
            ],
            "A2": [
                {"word": "comprendre", "meaning": "To understand", "example": "Je ne comprends pas.", "pos": "verb", "synonyms": "saisir", "category": "mental actions"},
                {"word": "travailler", "meaning": "To work", "example": "Je travaille à Paris.", "pos": "verb", "synonyms": "bosser", "category": "activities"},
                {"word": "important", "meaning": "Important", "example": "C'est très important.", "pos": "adjective", "synonyms": "essentiel", "category": "descriptions"},
                {"word": "ami", "meaning": "Friend", "example": "Il est mon meilleur ami.", "pos": "noun", "synonyms": "copain", "category": "relationships"},
                {"word": "vite", "meaning": "Fast, quickly", "example": "Il court très vite.", "pos": "adverb", "synonyms": "rapidement", "category": "manner"},
            ]
        },
        "Japanese": {
            "A1": [
                {"word": "こんにちは", "meaning": "Hello", "example": "こんにちは、元気ですか?", "pos": "interjection", "synonyms": "やあ", "category": "greetings"},
                {"word": "ありがとう", "meaning": "Thank you", "example": "ありがとうございます!", "pos": "interjection", "synonyms": "どうも", "category": "greetings"},
                {"word": "水", "meaning": "Water (mizu)", "example": "水をください。", "pos": "noun", "synonyms": "お水", "category": "essentials"},
                {"word": "本", "meaning": "Book (hon)", "example": "本を読みます。", "pos": "noun", "synonyms": "書籍", "category": "objects"},
                {"word": "いい", "meaning": "Good", "example": "これはいいです。", "pos": "adjective", "synonyms": "良い", "category": "descriptions"},
            ],
            "A2": [
                {"word": "分かる", "meaning": "To understand (wakaru)", "example": "分かりません。", "pos": "verb", "synonyms": "理解する", "category": "mental actions"},
                {"word": "働く", "meaning": "To work (hataraku)", "example": "毎日働きます。", "pos": "verb", "synonyms": "仕事する", "category": "activities"},
                {"word": "大切", "meaning": "Important (taisetsu)", "example": "これは大切です。", "pos": "adjective", "synonyms": "重要", "category": "descriptions"},
                {"word": "友達", "meaning": "Friend (tomodachi)", "example": "彼は私の友達です。", "pos": "noun", "synonyms": "友人", "category": "relationships"},
                {"word": "速い", "meaning": "Fast (hayai)", "example": "この電車は速いです。", "pos": "adjective", "synonyms": "高速", "category": "descriptions"},
            ]
        },
        "Hindi": {
            "A1": [
                {"word": "नमस्ते", "meaning": "Hello, Greetings", "example": "नमस्ते, आप कैसे हैं?", "pos": "interjection", "synonyms": "प्रणाम", "category": "greetings"},
                {"word": "धन्यवाद", "meaning": "Thank you", "example": "बहुत धन्यवाद!", "pos": "interjection", "synonyms": "शुक्रिया", "category": "greetings"},
                {"word": "पानी", "meaning": "Water", "example": "मुझे पानी चाहिए।", "pos": "noun", "synonyms": "जल", "category": "essentials"},
                {"word": "किताब", "meaning": "Book", "example": "यह एक अच्छी किताब है।", "pos": "noun", "synonyms": "पुस्तक", "category": "objects"},
                {"word": "अच्छा", "meaning": "Good", "example": "यह बहुत अच्छा है।", "pos": "adjective", "synonyms": "बढ़िया", "category": "descriptions"},
            ],
            "A2": [
                {"word": "समझना", "meaning": "To understand", "example": "मैं समझ गया।", "pos": "verb", "synonyms": "बूझना", "category": "mental actions"},
                {"word": "काम", "meaning": "Work", "example": "मुझे काम पर जाना है।", "pos": "noun", "synonyms": "कार्य", "category": "activities"},
                {"word": "ज़रूरी", "meaning": "Important, necessary", "example": "यह बहुत ज़रूरी है।", "pos": "adjective", "synonyms": "आवश्यक", "category": "descriptions"},
                {"word": "दोस्त", "meaning": "Friend", "example": "वह मेरा अच्छा दोस्त है।", "pos": "noun", "synonyms": "मित्र", "category": "relationships"},
                {"word": "जल्दी", "meaning": "Fast, quickly", "example": "जल्दी चलो!", "pos": "adverb", "synonyms": "तेज़ी से", "category": "manner"},
            ]
        }
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_session_words(self, language: str, level: str, count: int = 5) -> List[Dict]:
        """Get vocabulary words for a learning session"""
        # First check database
        db_words = self.db.query(VocabularyWord).filter(
            VocabularyWord.language == language,
            VocabularyWord.difficulty_level == level
        ).limit(count).all()
        
        if db_words and len(db_words) >= count:
            return [self._word_to_dict(w) for w in db_words]
        
        # Use vocabulary bank
        if language in self.VOCABULARY_BANK:
            level_vocab = self.VOCABULARY_BANK[language].get(level, self.VOCABULARY_BANK[language].get("A1", []))
            selected = random.sample(level_vocab, min(count, len(level_vocab)))
            return selected
        
        # Default to English A1
        return random.sample(self.VOCABULARY_BANK["English"]["A1"], min(count, 5))
    
    def _word_to_dict(self, word: VocabularyWord) -> Dict:
        """Convert VocabularyWord model to dictionary"""
        return {
            "word": word.word,
            "meaning": word.meaning,
            "example": word.example_sentence,
            "pos": word.part_of_speech,
            "synonyms": word.synonyms,
            "category": word.category
        }
    
    def generate_quiz(self, words: List[Dict]) -> List[Dict]:
        """Generate quiz questions for vocabulary words"""
        quiz = []
        
        for word_data in words:
            question_types = ["meaning", "example", "synonym"]
            q_type = random.choice(question_types)
            
            if q_type == "meaning":
                question = f"What is the meaning of '{word_data['word']}'?"
                correct = word_data["meaning"]
                options = self._generate_wrong_meanings(word_data["meaning"], words)
            elif q_type == "example":
                question = f"Which word best fits: '{word_data['example'].replace(word_data['word'], '____')}'?"
                correct = word_data["word"]
                options = [w["word"] for w in words if w["word"] != word_data["word"]][:3]
            else:  # synonym
                question = f"Which is a synonym of '{word_data['word']}'?"
                correct = word_data.get("synonyms", "").split(",")[0].strip() if word_data.get("synonyms") else word_data["meaning"][:20]
                options = self._generate_wrong_synonyms(correct)
            
            # Add correct answer and shuffle
            if correct not in options:
                options.append(correct)
            random.shuffle(options)
            
            quiz.append({
                "word": word_data["word"],
                "question_type": q_type,
                "question": question,
                "options": options[:4],
                "correct_answer": correct
            })
        
        return quiz
    
    def _generate_wrong_meanings(self, correct: str, words: List[Dict]) -> List[str]:
        """Generate wrong meaning options"""
        wrong = [w["meaning"] for w in words if w["meaning"] != correct]
        default_wrong = [
            "A type of action or movement",
            "Related to feelings or emotions",
            "Describing a place or location",
            "A form of communication"
        ]
        return (wrong + default_wrong)[:3]
    
    def _generate_wrong_synonyms(self, correct: str) -> List[str]:
        """Generate wrong synonym options"""
        wrong_synonyms = [
            "opposite", "rarely", "never", "sometimes",
            "large", "small", "fast", "slow",
            "begin", "end", "stop", "continue"
        ]
        return random.sample(wrong_synonyms, 3)
    
    def check_answer(self, word: str, user_answer: str, correct_answer: str) -> Dict:
        """Check user's quiz answer"""
        is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
        xp = 10 if is_correct else 0
        
        return {
            "word": word,
            "is_correct": is_correct,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "xp_earned": xp
        }
    
    def update_user_vocabulary(self, user_id: int, word_id: int, is_correct: bool):
        """Update user's vocabulary learning progress"""
        user_vocab = self.db.query(UserVocabulary).filter(
            UserVocabulary.user_id == user_id,
            UserVocabulary.vocabulary_id == word_id
        ).first()
        
        if not user_vocab:
            user_vocab = UserVocabulary(
                user_id=user_id,
                vocabulary_id=word_id,
                is_learned=False,
                times_practiced=0,
                correct_count=0,
                wrong_count=0,
                mastery_level=0,
            )
            self.db.add(user_vocab)

        # DB defaults may not populate until flush/commit; ensure safe ints.
        if user_vocab.mastery_level is None:
            user_vocab.mastery_level = 0
        
        user_vocab.times_practiced += 1
        if is_correct:
            user_vocab.correct_count += 1
            # Increase mastery if enough correct answers
            if user_vocab.correct_count >= 3 and user_vocab.mastery_level < 5:
                user_vocab.mastery_level += 1
            if user_vocab.mastery_level >= 3:
                user_vocab.is_learned = True
        else:
            user_vocab.wrong_count += 1
        
        self.db.commit()
