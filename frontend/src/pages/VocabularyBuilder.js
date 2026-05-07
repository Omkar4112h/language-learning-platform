import React, { useState, useEffect, useRef } from 'react';
import { vocabularyAPI, sessionAPI } from '../services/api';
import { FiCheck, FiX, FiArrowRight, FiBook, FiRefreshCw, FiHelpCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './FeaturePage.css';
import './VocabularyBuilder.css';

const VocabularyBuilder = () => {
  const { user, updateUser } = useAuth();
  const [mode, setMode] = useState('quiz'); // 'quiz' or 'learn'
  const [language, setLanguage] = useState('English');
  const [level, setLevel] = useState('A1');
  const [quizWords, setQuizWords] = useState([]);
  const [learnWords, setLearnWords] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [learnIndex, setLearnIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const sessionIdRef = useRef(null);

  const languages = ['English', 'German', 'Spanish', 'Hindi', 'French', 'Japanese'];
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // Get current index and words based on mode
  const currentIndex = mode === 'quiz' ? quizIndex : learnIndex;
  const setCurrentIndex = mode === 'quiz' ? setQuizIndex : setLearnIndex;
  const words = mode === 'quiz' ? quizWords : learnWords;

  // Shuffle array function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Generate hint - show English translation of the example sentence
  const getHint = (word) => {
    if (!word) return null;
    
    return {
      sentence: word.exampleHint || 'Think about the context of the sentence',
      category: word.category || 'word'
    };
  };

  // Fallback vocabulary for each language (15+ words each for variety)
  // exampleHint = English translation of the example sentence
  const fallbackVocabulary = {
    English: [
      { word: 'hello', translation: 'नमस्ते', example: 'Hello, how are you?', exampleHint: 'नमस्ते, आप कैसे हैं?', category: 'greetings' },
      { word: 'goodbye', translation: 'अलविदा', example: 'Goodbye, see you later!', exampleHint: 'अलविदा, बाद में मिलते हैं!', category: 'greetings' },
      { word: 'please', translation: 'कृपया', example: 'Please help me.', exampleHint: 'कृपया मेरी मदद करें।', category: 'expressions' },
      { word: 'thank you', translation: 'धन्यवाद', example: 'Thank you very much!', exampleHint: 'बहुत-बहुत धन्यवाद!', category: 'expressions' },
      { word: 'yes', translation: 'हां', example: 'Yes, I agree.', exampleHint: 'हां, मैं सहमत हूं।', category: 'basics' },
      { word: 'no', translation: 'नहीं', example: 'No, I disagree.', exampleHint: 'नहीं, मैं असहमत हूं।', category: 'basics' },
      { word: 'water', translation: 'पानी', example: 'I need water.', exampleHint: 'मुझे पानी चाहिए।', category: 'essentials' },
      { word: 'food', translation: 'खाना', example: 'The food is delicious.', exampleHint: 'खाना स्वादिष्ट है।', category: 'essentials' },
      { word: 'friend', translation: 'दोस्त', example: 'He is my friend.', exampleHint: 'वह मेरा दोस्त है।', category: 'relationships' },
      { word: 'family', translation: 'परिवार', example: 'I love my family.', exampleHint: 'मुझे अपने परिवार से प्यार है।', category: 'relationships' },
      { word: 'happy', translation: 'खुश', example: 'I am happy today.', exampleHint: 'मैं आज खुश हूं।', category: 'emotions' },
      { word: 'sad', translation: 'उदास', example: 'She looks sad.', exampleHint: 'वह उदास लग रही है।', category: 'emotions' },
      { word: 'big', translation: 'बड़ा', example: 'This is a big house.', exampleHint: 'यह एक बड़ा घर है।', category: 'descriptions' },
      { word: 'small', translation: 'छोटा', example: 'The cat is small.', exampleHint: 'बिल्ली छोटी है।', category: 'descriptions' },
      { word: 'good', translation: 'अच्छा', example: 'This is good.', exampleHint: 'यह अच्छा है।', category: 'descriptions' }
    ],
    Hindi: [
      { word: 'नमस्ते', translation: 'Hello', example: 'नमस्ते, आप कैसे हैं?', exampleHint: 'Hello, how are you?', category: 'greetings' },
      { word: 'धन्यवाद', translation: 'Thank you', example: 'बहुत धन्यवाद!', exampleHint: 'Thank you very much!', category: 'expressions' },
      { word: 'पानी', translation: 'Water', example: 'मुझे पानी चाहिए।', exampleHint: 'I need water.', category: 'essentials' },
      { word: 'किताब', translation: 'Book', example: 'यह एक अच्छी किताब है।', exampleHint: 'This is a good book.', category: 'objects' },
      { word: 'अच्छा', translation: 'Good', example: 'यह बहुत अच्छा है।', exampleHint: 'This is very good.', category: 'descriptions' },
      { word: 'दोस्त', translation: 'Friend', example: 'वह मेरा अच्छा दोस्त है।', exampleHint: 'He is my good friend.', category: 'relationships' },
      { word: 'काम', translation: 'Work', example: 'मुझे काम पर जाना है।', exampleHint: 'I have to go to work.', category: 'activities' },
      { word: 'जल्दी', translation: 'Quickly', example: 'जल्दी चलो!', exampleHint: 'Come quickly!', category: 'manner' },
      { word: 'समझना', translation: 'Understand', example: 'मैं समझ गया।', exampleHint: 'I understood.', category: 'actions' },
      { word: 'ज़रूरी', translation: 'Important', example: 'यह बहुत ज़रूरी है।', exampleHint: 'This is very important.', category: 'descriptions' },
      { word: 'खाना', translation: 'Food', example: 'खाना बहुत स्वादिष्ट है।', exampleHint: 'The food is very delicious.', category: 'essentials' },
      { word: 'घर', translation: 'House', example: 'मेरा घर यहाँ है।', exampleHint: 'My house is here.', category: 'places' },
      { word: 'स्कूल', translation: 'School', example: 'बच्चे स्कूल जाते हैं।', exampleHint: 'Children go to school.', category: 'places' },
      { word: 'प्यार', translation: 'Love', example: 'माँ का प्यार अनमोल है।', exampleHint: "Mother's love is priceless.", category: 'emotions' },
      { word: 'खुश', translation: 'Happy', example: 'मैं बहुत खुश हूँ।', exampleHint: 'I am very happy.', category: 'emotions' }
    ],
    Spanish: [
      { word: 'Hola', translation: 'Hello', example: '¡Hola! ¿Cómo estás?', exampleHint: 'Hello! How are you?', category: 'greetings' },
      { word: 'Gracias', translation: 'Thank you', example: 'Muchas gracias por tu ayuda.', exampleHint: 'Thank you very much for your help.', category: 'expressions' },
      { word: 'Agua', translation: 'Water', example: 'Necesito un vaso de agua.', exampleHint: 'I need a glass of water.', category: 'essentials' },
      { word: 'Libro', translation: 'Book', example: 'Estoy leyendo un libro.', exampleHint: 'I am reading a book.', category: 'objects' },
      { word: 'Bueno', translation: 'Good', example: 'Este restaurante es muy bueno.', exampleHint: 'This restaurant is very good.', category: 'descriptions' },
      { word: 'Adiós', translation: 'Goodbye', example: '¡Adiós, hasta luego!', exampleHint: 'Goodbye, see you later!', category: 'greetings' },
      { word: 'Por favor', translation: 'Please', example: 'Por favor, ayúdame.', exampleHint: 'Please, help me.', category: 'expressions' },
      { word: 'Amigo', translation: 'Friend', example: 'Él es mi mejor amigo.', exampleHint: 'He is my best friend.', category: 'relationships' },
      { word: 'Casa', translation: 'House', example: 'Mi casa es grande.', exampleHint: 'My house is big.', category: 'places' },
      { word: 'Comida', translation: 'Food', example: 'La comida está deliciosa.', exampleHint: 'The food is delicious.', category: 'essentials' },
      { word: 'Feliz', translation: 'Happy', example: 'Estoy muy feliz hoy.', exampleHint: 'I am very happy today.', category: 'emotions' },
      { word: 'Triste', translation: 'Sad', example: 'Ella está triste.', exampleHint: 'She is sad.', category: 'emotions' },
      { word: 'Grande', translation: 'Big', example: 'El perro es grande.', exampleHint: 'The dog is big.', category: 'descriptions' },
      { word: 'Pequeño', translation: 'Small', example: 'El gato es pequeño.', exampleHint: 'The cat is small.', category: 'descriptions' },
      { word: 'Amor', translation: 'Love', example: 'El amor es bonito.', exampleHint: 'Love is beautiful.', category: 'emotions' }
    ],
    German: [
      { word: 'Hallo', translation: 'Hello', example: 'Hallo, wie geht es dir?', exampleHint: 'Hello, how are you?', category: 'greetings' },
      { word: 'Danke', translation: 'Thank you', example: 'Danke schön!', exampleHint: 'Thank you very much!', category: 'expressions' },
      { word: 'Wasser', translation: 'Water', example: 'Ich trinke Wasser.', exampleHint: 'I drink water.', category: 'essentials' },
      { word: 'Buch', translation: 'Book', example: 'Ich lese ein Buch.', exampleHint: 'I am reading a book.', category: 'objects' },
      { word: 'Gut', translation: 'Good', example: 'Das ist sehr gut.', exampleHint: 'That is very good.', category: 'descriptions' },
      { word: 'Tschüss', translation: 'Goodbye', example: 'Tschüss, bis später!', exampleHint: 'Goodbye, see you later!', category: 'greetings' },
      { word: 'Bitte', translation: 'Please', example: 'Bitte hilf mir.', exampleHint: 'Please help me.', category: 'expressions' },
      { word: 'Freund', translation: 'Friend', example: 'Er ist mein Freund.', exampleHint: 'He is my friend.', category: 'relationships' },
      { word: 'Haus', translation: 'House', example: 'Mein Haus ist groß.', exampleHint: 'My house is big.', category: 'places' },
      { word: 'Essen', translation: 'Food', example: 'Das Essen ist lecker.', exampleHint: 'The food is delicious.', category: 'essentials' },
      { word: 'Glücklich', translation: 'Happy', example: 'Ich bin glücklich.', exampleHint: 'I am happy.', category: 'emotions' },
      { word: 'Traurig', translation: 'Sad', example: 'Sie ist traurig.', exampleHint: 'She is sad.', category: 'emotions' },
      { word: 'Groß', translation: 'Big', example: 'Der Hund ist groß.', exampleHint: 'The dog is big.', category: 'descriptions' },
      { word: 'Klein', translation: 'Small', example: 'Die Katze ist klein.', exampleHint: 'The cat is small.', category: 'descriptions' },
      { word: 'Liebe', translation: 'Love', example: 'Die Liebe ist schön.', exampleHint: 'Love is beautiful.', category: 'emotions' }
    ],
    French: [
      { word: 'Bonjour', translation: 'Hello', example: 'Bonjour! Comment allez-vous?', exampleHint: 'Hello! How are you?', category: 'greetings' },
      { word: 'Merci', translation: 'Thank you', example: 'Merci beaucoup!', exampleHint: 'Thank you very much!', category: 'expressions' },
      { word: 'Eau', translation: 'Water', example: "Je voudrais de l'eau.", exampleHint: 'I would like some water.', category: 'essentials' },
      { word: 'Livre', translation: 'Book', example: 'Je lis un livre.', exampleHint: 'I am reading a book.', category: 'objects' },
      { word: 'Bon', translation: 'Good', example: "C'est très bon!", exampleHint: 'It is very good!', category: 'descriptions' },
      { word: 'Au revoir', translation: 'Goodbye', example: 'Au revoir, à bientôt!', exampleHint: 'Goodbye, see you soon!', category: 'greetings' },
      { word: "S'il vous plaît", translation: 'Please', example: "S'il vous plaît, aidez-moi.", exampleHint: 'Please, help me.', category: 'expressions' },
      { word: 'Ami', translation: 'Friend', example: 'Il est mon ami.', exampleHint: 'He is my friend.', category: 'relationships' },
      { word: 'Maison', translation: 'House', example: 'Ma maison est grande.', exampleHint: 'My house is big.', category: 'places' },
      { word: 'Nourriture', translation: 'Food', example: 'La nourriture est délicieuse.', exampleHint: 'The food is delicious.', category: 'essentials' },
      { word: 'Heureux', translation: 'Happy', example: 'Je suis heureux.', exampleHint: 'I am happy.', category: 'emotions' },
      { word: 'Triste', translation: 'Sad', example: 'Elle est triste.', exampleHint: 'She is sad.', category: 'emotions' },
      { word: 'Grand', translation: 'Big', example: 'Le chien est grand.', exampleHint: 'The dog is big.', category: 'descriptions' },
      { word: 'Petit', translation: 'Small', example: 'Le chat est petit.', exampleHint: 'The cat is small.', category: 'descriptions' },
      { word: 'Amour', translation: 'Love', example: "L'amour est beau.", exampleHint: 'Love is beautiful.', category: 'emotions' }
    ],
    Japanese: [
      { word: 'こんにちは', translation: 'Hello', example: 'こんにちは、元気ですか?', exampleHint: 'Hello, how are you?', category: 'greetings' },
      { word: 'ありがとう', translation: 'Thank you', example: 'ありがとうございます!', exampleHint: 'Thank you very much!', category: 'expressions' },
      { word: '水', translation: 'Water', example: '水をください。', exampleHint: 'Please give me water.', category: 'essentials' },
      { word: '本', translation: 'Book', example: '本を読みます。', exampleHint: 'I read a book.', category: 'objects' },
      { word: 'いい', translation: 'Good', example: 'これはいいです。', exampleHint: 'This is good.', category: 'descriptions' },
      { word: 'さようなら', translation: 'Goodbye', example: 'さようなら、また会いましょう!', exampleHint: "Goodbye, let's meet again!", category: 'greetings' },
      { word: 'お願いします', translation: 'Please', example: 'お願いします、助けてください。', exampleHint: 'Please, help me.', category: 'expressions' },
      { word: '友達', translation: 'Friend', example: '彼は私の友達です。', exampleHint: 'He is my friend.', category: 'relationships' },
      { word: '家', translation: 'House', example: '私の家は大きいです。', exampleHint: 'My house is big.', category: 'places' },
      { word: '食べ物', translation: 'Food', example: '食べ物は美味しいです。', exampleHint: 'The food is delicious.', category: 'essentials' },
      { word: '嬉しい', translation: 'Happy', example: '私は嬉しいです。', exampleHint: 'I am happy.', category: 'emotions' },
      { word: '悲しい', translation: 'Sad', example: '彼女は悲しいです。', exampleHint: 'She is sad.', category: 'emotions' },
      { word: '大きい', translation: 'Big', example: '犬は大きいです。', exampleHint: 'The dog is big.', category: 'descriptions' },
      { word: '小さい', translation: 'Small', example: '猫は小さいです。', exampleHint: 'The cat is small.', category: 'descriptions' },
      { word: '愛', translation: 'Love', example: '愛は美しいです。', exampleHint: 'Love is beautiful.', category: 'emotions' }
    ]
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Start a new session for this language/level.
      try {
        const response = await sessionAPI.startSession({
          session_type: 'vocabulary',
          target_language: language,
          difficulty_level: user?.current_level || 'A1',
        });

        const newSessionId = response.data?.session_id || response.data?.id || null;

        // If the effect was cleaned up (StrictMode or route change), immediately end the created session.
        if (cancelled) {
          if (newSessionId) {
            endSession(newSessionId);
          }
          return;
        }

        setSession(response.data);
        sessionIdRef.current = newSessionId;
      } catch (error) {
        // Session tracking is optional; vocabulary can still work without it.
        console.log('Session optional');
      }

      // Fetch words for this language/level.
      if (!cancelled) {
        fetchWords();
      }
    };

    run();

    return () => {
      cancelled = true;
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };
  }, [language, level, user?.current_level]);

  const endSession = async (sessionId) => {
    try {
      await sessionAPI.endSession(sessionId);
    } catch (error) {
      console.log('Session end error');
    }
  };

  const fetchWords = async () => {
    setLoading(true);
    try {
      const response = await vocabularyAPI.getSessionWords({
        language: language,
        level: level,
        count: 15
      });
      // Map backend 'meaning' field to 'translation' for frontend
      const mappedWords = response.data.map(word => ({
        ...word,
        translation: word.translation || word.meaning || word.word
      }));
      // Shuffle separately for quiz and learn - each gets different order
      const quizShuffled = shuffleArray(mappedWords).slice(0, 10);
      const learnShuffled = shuffleArray(mappedWords).slice(0, 10);
      setQuizWords(quizShuffled);
      setLearnWords(learnShuffled);
      setQuizIndex(0);
      setLearnIndex(0);
      setShowAnswer(false);
      setShowHint(false);
      setUserAnswer('');
    } catch (error) {
      // Use language-specific fallback words - shuffle separately for quiz and learn
      const fallback = fallbackVocabulary[language] || fallbackVocabulary['English'];
      const quizShuffled = shuffleArray(fallback).slice(0, 10);
      const learnShuffled = shuffleArray(fallback).slice(0, 10);
      setQuizWords(quizShuffled);
      setLearnWords(learnShuffled);
      setQuizIndex(0);
      setLearnIndex(0);
      setShowAnswer(false);
      setShowHint(false);
      setUserAnswer('');
    } finally {
      setLoading(false);
    }
  };

  const currentWord = words[currentIndex];

  const handleCheckAnswer = async () => {
    if (!userAnswer.trim()) return;

    setShowAnswer(true);
    const isCorrect = userAnswer.toLowerCase().trim() === currentWord?.translation?.toLowerCase().trim();
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      toast.success('Correct! +10 XP');
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
    }

    try {
      await vocabularyAPI.checkAnswer({
        word_id: currentWord?.id || 0,
        user_answer: userAnswer,
        word: currentWord?.word,
        language: language,
        difficulty_level: level,
        session_id: session?.session_id || session?.id
      }, currentWord?.translation);
      // Refresh user data to show updated XP
      await updateUser();
    } catch (error) {
      console.log('XP update error:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      if (mode === 'quiz') {
        setQuizIndex(prev => prev + 1);
      } else {
        setLearnIndex(prev => prev + 1);
      }
      setShowAnswer(false);
      setShowHint(false);
      setUserAnswer('');
    } else {
      if (mode === 'quiz') {
        toast.info(`Quiz complete! Score: ${score.correct}/${words.length}`);
      } else {
        toast.success(`Learning complete! You reviewed all ${words.length} words.`);
      }
    }
  };

  const handleReset = () => {
    // Shuffle words separately for quiz and learn
    const quizShuffled = shuffleArray([...quizWords]);
    const learnShuffled = shuffleArray([...learnWords]);
    setQuizWords(quizShuffled);
    setLearnWords(learnShuffled);
    setQuizIndex(0);
    setLearnIndex(0);
    setShowAnswer(false);
    setShowHint(false);
    setUserAnswer('');
    setScore({ correct: 0, wrong: 0 });
  };

  const handleNewWords = () => {
    setScore({ correct: 0, wrong: 0 });
    fetchWords();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (showAnswer) {
        handleNext();
      } else {
        handleCheckAnswer();
      }
    }
  };

  if (loading) {
    return (
      <div className="feature-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page vocabulary-page">
      <div className="feature-header">
        <div>
          <h1 className="page-title">Vocabulary Builder</h1>
          <p className="page-subtitle">Learn new words with quizzes and flashcards</p>
        </div>
        <div className="session-stats">
          <span className="stat correct">{score.correct} correct</span>
          <span className="stat wrong">{score.wrong} wrong</span>
        </div>
      </div>

      <div className="vocab-controls card">
        <div className="control-group">
          <label className="form-label">Language</label>
          <select
            className="form-input"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label className="form-label">Level</label>
          <select
            className="form-input"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {levels.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label className="form-label">Mode</label>
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${mode === 'quiz' ? 'active' : ''}`}
              onClick={() => {
                setMode('quiz');
                setShowAnswer(false);
                setShowHint(false);
                setUserAnswer('');
              }}
            >
              Quiz
            </button>
            <button 
              className={`mode-btn ${mode === 'learn' ? 'active' : ''}`}
              onClick={() => {
                setMode('learn');
                setShowAnswer(false);
                setShowHint(false);
              }}
            >
              Learn
            </button>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handleNewWords}>
          <FiRefreshCw /> New Words
        </button>
      </div>

      {words.length > 0 && currentWord && (
        <div className="vocab-card card">
          <div className="vocab-progress">
            <span>{mode === 'quiz' ? 'Quiz' : 'Learn'}: {currentIndex + 1} / {words.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="word-display">
            <span className="word-label">Word:</span>
            <h2 className="word-text">{currentWord.word}</h2>
            {currentWord.example && (
              <p className="word-example">"{currentWord.example}"</p>
            )}
          </div>

          {mode === 'quiz' ? (
            <div className="quiz-section">
              <div className="form-group">
                <label className="form-label">Your Translation:</label>
                <input
                  type="text"
                  className="form-input quiz-input"
                  placeholder="Type the translation..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={showAnswer}
                />
              </div>

              {showAnswer && (
                <div className={`answer-feedback ${userAnswer.toLowerCase().trim() === currentWord.translation?.toLowerCase().trim() ? 'correct' : 'incorrect'}`}>
                  {userAnswer.toLowerCase().trim() === currentWord.translation?.toLowerCase().trim() ? (
                    <>
                      <FiCheck /> Correct!
                    </>
                  ) : (
                    <>
                      <FiX /> Incorrect. The answer is: <strong>{currentWord.translation}</strong>
                    </>
                  )}
                </div>
              )}

              <div className="quiz-actions">
                {!showAnswer ? (
                  <button 
                    className="btn btn-primary"
                    onClick={handleCheckAnswer}
                    disabled={!userAnswer.trim()}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleNext}>
                    {currentIndex < words.length - 1 ? 'Next Word' : 'Finish'}
                    <FiArrowRight />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="learn-section">
              {/* Hint Section */}
              {!showAnswer && (
                <div className="hint-section">
                  {showHint ? (
                    <div className="hint-display">
                      <span className="hint-label"><FiHelpCircle /> Hint:</span>
                      <div className="hint-content">
                        <p className="hint-sentence">{getHint(currentWord)?.sentence}</p>
                        {currentWord.category && (
                          <p className="hint-info">Category: <strong>{currentWord.category}</strong></p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-hint"
                      onClick={() => setShowHint(true)}
                    >
                      <FiHelpCircle /> Show Hint
                    </button>
                  )}
                </div>
              )}

              <div className="translation-reveal">
                {showAnswer ? (
                  <div className="translation-shown">
                    <span className="translation-label">Translation:</span>
                    <h3>{currentWord.translation}</h3>
                  </div>
                ) : (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowAnswer(true)}
                  >
                    Reveal Translation
                  </button>
                )}
              </div>

              <div className="learn-actions">
                <button className="btn btn-primary" onClick={handleNext}>
                  {currentIndex < words.length - 1 ? 'Next Word' : 'Finish'}
                  <FiArrowRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {words.length === 0 && !loading && (
        <div className="empty-state card">
          <FiBook />
          <p>No words available. Try selecting a different language or level.</p>
          <button className="btn btn-primary" onClick={fetchWords}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default VocabularyBuilder;
