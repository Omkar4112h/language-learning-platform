import React, { useState } from 'react';
import { FiPlay, FiArrowLeft, FiStar, FiZap, FiTarget, FiGrid } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { gamesAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Games.css';

// Word data for games (15 words per language for 10-question games)
const wordsByLanguage = {
  English: [
    { word: 'apple', translation: 'सेब', hint: 'A fruit' },
    { word: 'book', translation: 'किताब', hint: 'You read this' },
    { word: 'water', translation: 'पानी', hint: 'You drink this' },
    { word: 'house', translation: 'घर', hint: 'You live here' },
    { word: 'cat', translation: 'बिल्ली', hint: 'A pet animal' },
    { word: 'dog', translation: 'कुत्ता', hint: 'Mans best friend' },
    { word: 'sun', translation: 'सूर्य', hint: 'In the sky' },
    { word: 'moon', translation: 'चाँद', hint: 'Night light' },
    { word: 'tree', translation: 'पेड़', hint: 'Has leaves' },
    { word: 'flower', translation: 'फूल', hint: 'Beautiful plant' },
    { word: 'car', translation: 'कार', hint: 'Vehicle with 4 wheels' },
    { word: 'bird', translation: 'पक्षी', hint: 'Can fly' },
    { word: 'fish', translation: 'मछली', hint: 'Lives in water' },
    { word: 'chair', translation: 'कुर्सी', hint: 'You sit on it' },
    { word: 'table', translation: 'मेज', hint: 'Furniture for eating' },
  ],
  Spanish: [
    { word: 'hola', translation: 'hello', hint: 'Greeting' },
    { word: 'agua', translation: 'water', hint: 'You drink this' },
    { word: 'casa', translation: 'house', hint: 'You live here' },
    { word: 'gato', translation: 'cat', hint: 'A pet' },
    { word: 'perro', translation: 'dog', hint: 'Barks' },
    { word: 'libro', translation: 'book', hint: 'You read this' },
    { word: 'sol', translation: 'sun', hint: 'In sky' },
    { word: 'luna', translation: 'moon', hint: 'Night' },
    { word: 'amor', translation: 'love', hint: 'Heart feeling' },
    { word: 'tiempo', translation: 'time', hint: 'Clock shows' },
    { word: 'coche', translation: 'car', hint: 'Vehicle' },
    { word: 'mesa', translation: 'table', hint: 'Furniture' },
    { word: 'silla', translation: 'chair', hint: 'Sit on it' },
    { word: 'comida', translation: 'food', hint: 'You eat this' },
    { word: 'familia', translation: 'family', hint: 'Your relatives' },
  ],
  German: [
    { word: 'hallo', translation: 'hello', hint: 'Greeting' },
    { word: 'wasser', translation: 'water', hint: 'Drink' },
    { word: 'haus', translation: 'house', hint: 'Home' },
    { word: 'katze', translation: 'cat', hint: 'Pet' },
    { word: 'hund', translation: 'dog', hint: 'Barks' },
    { word: 'buch', translation: 'book', hint: 'Read' },
    { word: 'sonne', translation: 'sun', hint: 'Sky' },
    { word: 'mond', translation: 'moon', hint: 'Night' },
    { word: 'liebe', translation: 'love', hint: 'Heart' },
    { word: 'zeit', translation: 'time', hint: 'Clock' },
    { word: 'auto', translation: 'car', hint: 'Vehicle' },
    { word: 'tisch', translation: 'table', hint: 'Furniture' },
    { word: 'stuhl', translation: 'chair', hint: 'Sit' },
    { word: 'essen', translation: 'food', hint: 'Eat' },
    { word: 'freund', translation: 'friend', hint: 'Buddy' },
  ],
  French: [
    { word: 'bonjour', translation: 'hello', hint: 'Greeting' },
    { word: 'eau', translation: 'water', hint: 'Drink' },
    { word: 'maison', translation: 'house', hint: 'Home' },
    { word: 'chat', translation: 'cat', hint: 'Pet' },
    { word: 'chien', translation: 'dog', hint: 'Barks' },
    { word: 'livre', translation: 'book', hint: 'Read' },
    { word: 'soleil', translation: 'sun', hint: 'Sky' },
    { word: 'lune', translation: 'moon', hint: 'Night' },
    { word: 'amour', translation: 'love', hint: 'Heart' },
    { word: 'temps', translation: 'time', hint: 'Clock' },
    { word: 'voiture', translation: 'car', hint: 'Vehicle' },
    { word: 'table', translation: 'table', hint: 'Furniture' },
    { word: 'chaise', translation: 'chair', hint: 'Sit' },
    { word: 'pain', translation: 'bread', hint: 'Baked food' },
    { word: 'ami', translation: 'friend', hint: 'Buddy' },
  ],
  Hindi: [
    { word: 'नमस्ते', translation: 'hello', hint: 'Greeting' },
    { word: 'पानी', translation: 'water', hint: 'Drink' },
    { word: 'घर', translation: 'house', hint: 'Home' },
    { word: 'बिल्ली', translation: 'cat', hint: 'Pet' },
    { word: 'कुत्ता', translation: 'dog', hint: 'Barks' },
    { word: 'किताब', translation: 'book', hint: 'Read' },
    { word: 'सूर्य', translation: 'sun', hint: 'Sky' },
    { word: 'चाँद', translation: 'moon', hint: 'Night' },
    { word: 'प्यार', translation: 'love', hint: 'Heart' },
    { word: 'समय', translation: 'time', hint: 'Clock' },
    { word: 'गाड़ी', translation: 'car', hint: 'Vehicle' },
    { word: 'मेज', translation: 'table', hint: 'Furniture' },
    { word: 'कुर्सी', translation: 'chair', hint: 'Sit' },
    { word: 'खाना', translation: 'food', hint: 'Eat' },
    { word: 'दोस्त', translation: 'friend', hint: 'Buddy' },
  ],
  Japanese: [
    { word: 'こんにちは', translation: 'hello', hint: 'Greeting' },
    { word: 'みず', translation: 'water', hint: 'Drink' },
    { word: 'いえ', translation: 'house', hint: 'Home' },
    { word: 'ねこ', translation: 'cat', hint: 'Pet' },
    { word: 'いぬ', translation: 'dog', hint: 'Barks' },
    { word: 'ほん', translation: 'book', hint: 'Read' },
    { word: 'たいよう', translation: 'sun', hint: 'Sky' },
    { word: 'つき', translation: 'moon', hint: 'Night' },
    { word: 'あい', translation: 'love', hint: 'Heart' },
    { word: 'じかん', translation: 'time', hint: 'Clock' },
    { word: 'くるま', translation: 'car', hint: 'Vehicle' },
    { word: 'つくえ', translation: 'desk', hint: 'Furniture' },
    { word: 'いす', translation: 'chair', hint: 'Sit' },
    { word: 'たべもの', translation: 'food', hint: 'Eat' },
    { word: 'ともだち', translation: 'friend', hint: 'Buddy' },
  ],
};

const Games = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [language, setLanguage] = useState('Spanish');
  const { updateUser } = useAuth();
  
  const languages = ['English', 'Spanish', 'German', 'French', 'Hindi', 'Japanese'];

  const games = [
    {
      id: 'scramble',
      name: 'Word Scramble',
      description: '10 words to unscramble - test your spelling!',
      icon: <FiZap />,
      color: '#e74c3c',
      xpReward: 20,
    },
    {
      id: 'memory',
      name: 'Memory Match',
      description: 'Match 10 word pairs with their translations',
      icon: <FiGrid />,
      color: '#3498db',
      xpReward: 25,
    },
    {
      id: 'hangman',
      name: 'Hangman',
      description: 'Guess 10 words letter by letter',
      icon: <FiTarget />,
      color: '#2ecc71',
      xpReward: 20,
    },
  ];

  const handleGameComplete = async (gameType, xp) => {
    try {
      await gamesAPI.completeGame(gameType, 0, xp);
      toast.success(`+${xp} XP earned!`);
      await updateUser();
    } catch (error) {
      console.error('Failed to record game:', error);
      toast.success(`+${xp} XP earned!`);
      await updateUser();
    }
  };

  if (selectedGame === 'scramble') {
    return <WordScramble 
      language={language} 
      onBack={() => setSelectedGame(null)} 
      onComplete={(xp) => handleGameComplete('scramble', xp)}
    />;
  }

  if (selectedGame === 'memory') {
    return <MemoryMatch 
      language={language} 
      onBack={() => setSelectedGame(null)} 
      onComplete={(xp) => handleGameComplete('memory', xp)}
    />;
  }

  if (selectedGame === 'hangman') {
    return <Hangman 
      language={language} 
      onBack={() => setSelectedGame(null)} 
      onComplete={(xp) => handleGameComplete('hangman', xp)}
    />;
  }

  return (
    <div className="games-page">
      <div className="games-header">
        <h1><FiPlay /> Language Games</h1>
        <p>Learn while having fun! Earn XP by playing games.</p>
        
        <div className="language-selector">
          <label>Select Language:</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="games-grid">
        {games.map(game => (
          <div 
            key={game.id} 
            className="game-card"
            style={{ '--game-color': game.color }}
            onClick={() => setSelectedGame(game.id)}
          >
            <div className="game-icon">{game.icon}</div>
            <h3>{game.name}</h3>
            <p>{game.description}</p>
            <div className="game-reward">
              <FiStar /> {game.xpReward} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Word Scramble Game Component
const WordScramble = ({ language, onBack, onComplete }) => {
  const words = wordsByLanguage[language] || wordsByLanguage['Spanish'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentWord = words[currentIndex];
  
  const scrambleWord = (word) => {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Make sure scrambled word is different
    if (arr.join('') === word) {
      return arr.reverse().join('');
    }
    return arr.join('');
  };

  const [scrambled, setScrambled] = useState(scrambleWord(currentWord.word));

  const handleSubmit = () => {
    if (userInput.toLowerCase() === currentWord.word.toLowerCase()) {
      setScore(score + 1);
      setFeedback({ type: 'correct', message: '✓ Correct!' });
    } else {
      setFeedback({ type: 'wrong', message: `✗ Wrong! Answer: ${currentWord.word}` });
    }

    setTimeout(() => {
      if (currentIndex < 9) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setScrambled(scrambleWord(words[nextIndex].word));
        setUserInput('');
        setShowHint(false);
        setFeedback(null);
      } else {
        setGameOver(true);
        onComplete(score * 2);
      }
    }, 1500);
  };

  if (gameOver) {
    return (
      <div className="game-container">
        <div className="game-over">
          <h2>🎉 Game Over!</h2>
          <p className="final-score">Your Score: {score}/10</p>
          <p className="xp-earned">+{score * 2} XP Earned!</p>
          <button className="btn-primary" onClick={onBack}>Back to Games</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="btn-back" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <h2>Word Scramble</h2>
        <div className="score">Score: {score}/10</div>
      </div>

      <div className="game-content">
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(currentIndex + 1) * 10}%` }}></div>
        </div>

        <div className="scramble-word">{scrambled}</div>
        
        <p className="translation-hint">Translation: {currentWord.translation}</p>

        {showHint && <p className="hint">Hint: {currentWord.hint}</p>}

        {feedback && (
          <div className={`feedback ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type the unscrambled word..."
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={feedback !== null}
        />

        <div className="game-buttons">
          <button className="btn-hint" onClick={() => setShowHint(true)} disabled={showHint}>
            Show Hint
          </button>
          <button className="btn-submit" onClick={handleSubmit} disabled={!userInput || feedback !== null}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// Memory Match Game Component
const MemoryMatch = ({ language, onBack, onComplete }) => {
  const words = wordsByLanguage[language] || wordsByLanguage['Spanish'];
  const selectedWords = words.slice(0, 10); // 10 pairs = 20 cards
  
  const createCards = () => {
    const cards = [];
    selectedWords.forEach((item, idx) => {
      cards.push({ id: idx * 2, content: item.word, type: 'word', pairId: idx });
      cards.push({ id: idx * 2 + 1, content: item.translation, type: 'translation', pairId: idx });
    });
    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  };

  const [cards, setCards] = useState(createCards());
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const handleCardClick = (card) => {
    if (flipped.length === 2 || flipped.includes(card.id) || matched.includes(card.pairId)) {
      return;
    }

    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped.map(id => cards.find(c => c.id === id));
      
      if (first.pairId === second.pairId) {
        const newMatched = [...matched, first.pairId];
        setMatched(newMatched);
        setFlipped([]);
        
        if (newMatched.length === 10) { // 10 pairs to match
          setGameOver(true);
          const xp = Math.max(25 - Math.floor(moves / 2), 10);
          onComplete(xp);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  if (gameOver) {
    const xp = Math.max(25 - Math.floor(moves / 2), 10);
    return (
      <div className="game-container">
        <div className="game-over">
          <h2>🎉 You Won!</h2>
          <p className="final-score">Matched 10 pairs in {moves} moves</p>
          <p className="xp-earned">+{xp} XP Earned!</p>
          <button className="btn-primary" onClick={onBack}>Back to Games</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="btn-back" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <h2>Memory Match</h2>
        <div className="score">Moves: {moves}</div>
      </div>

      <div className="memory-grid">
        {cards.map(card => (
          <div
            key={card.id}
            className={`memory-card ${flipped.includes(card.id) ? 'flipped' : ''} ${matched.includes(card.pairId) ? 'matched' : ''}`}
            onClick={() => handleCardClick(card)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Hangman Game Component - 10 rounds
const Hangman = ({ language, onBack, onComplete }) => {
  const words = wordsByLanguage[language] || wordsByLanguage['Spanish'];
  
  // Shuffle and pick 10 words for 10 rounds
  const shuffleArray = (arr) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };
  
  const [gameWords] = useState(() => shuffleArray(words).slice(0, 10));
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [roundStatus, setRoundStatus] = useState('playing'); // playing, won, lost
  const [gameOver, setGameOver] = useState(false);
  const maxWrong = 6;

  const currentWord = gameWords[currentRound];
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  
  // For non-Latin scripts, show the word with blanks for translation
  const isLatinScript = /^[a-zA-Z]+$/.test(currentWord.word);
  const targetWord = isLatinScript ? currentWord.word.toLowerCase() : currentWord.translation.toLowerCase();

  const displayWord = targetWord.split('').map(letter => 
    guessedLetters.includes(letter) ? letter : '_'
  ).join(' ');

  const handleGuess = (letter) => {
    if (guessedLetters.includes(letter) || roundStatus !== 'playing') return;

    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);

    if (!targetWord.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);
      if (newWrong >= maxWrong) {
        setRoundStatus('lost');
        setTimeout(() => nextRound(false), 1500);
      }
    } else {
      const isComplete = targetWord.split('').every(l => newGuessed.includes(l));
      if (isComplete) {
        setRoundStatus('won');
        setScore(score + 1);
        setTimeout(() => nextRound(true), 1500);
      }
    }
  };

  const nextRound = (won) => {
    if (currentRound < 9) {
      setCurrentRound(currentRound + 1);
      setGuessedLetters([]);
      setWrongGuesses(0);
      setRoundStatus('playing');
    } else {
      const finalScore = won ? score + 1 : score;
      setGameOver(true);
      onComplete(finalScore * 2);
    }
  };

  const hangmanParts = [
    <circle key="head" cx="150" cy="70" r="20" className="hangman-part" />,
    <line key="body" x1="150" y1="90" x2="150" y2="150" className="hangman-part" />,
    <line key="leftArm" x1="150" y1="110" x2="120" y2="140" className="hangman-part" />,
    <line key="rightArm" x1="150" y1="110" x2="180" y2="140" className="hangman-part" />,
    <line key="leftLeg" x1="150" y1="150" x2="120" y2="190" className="hangman-part" />,
    <line key="rightLeg" x1="150" y1="150" x2="180" y2="190" className="hangman-part" />,
  ];

  if (gameOver) {
    return (
      <div className="game-container">
        <div className="game-over">
          <h2>🎉 Game Complete!</h2>
          <p className="final-score">You guessed {score}/10 words!</p>
          <p className="xp-earned">+{score * 2} XP Earned!</p>
          <button className="btn-primary" onClick={onBack}>Back to Games</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="btn-back" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <h2>Hangman</h2>
        <div className="score">Round: {currentRound + 1}/10 | Score: {score}</div>
      </div>

      <div className="hangman-content">
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(currentRound + 1) * 10}%` }}></div>
        </div>

        <svg className="hangman-svg" viewBox="0 0 300 250">
          {/* Gallows */}
          <line x1="60" y1="230" x2="240" y2="230" className="gallows" />
          <line x1="100" y1="230" x2="100" y2="20" className="gallows" />
          <line x1="100" y1="20" x2="150" y2="20" className="gallows" />
          <line x1="150" y1="20" x2="150" y2="50" className="gallows" />
          {/* Hangman parts */}
          {hangmanParts.slice(0, wrongGuesses)}
        </svg>

        {roundStatus !== 'playing' && (
          <div className={`feedback ${roundStatus === 'won' ? 'correct' : 'wrong'}`}>
            {roundStatus === 'won' ? '✓ Correct!' : `✗ The word was: ${targetWord}`}
          </div>
        )}

        <p className="hint-text">Hint: {currentWord.hint}</p>
        {!isLatinScript && <p className="original-word">Word: {currentWord.word}</p>}
        
        <div className="word-display">{displayWord}</div>

        <div className="alphabet-grid">
          {alphabet.map(letter => (
            <button
              key={letter}
              className={`letter-btn ${guessedLetters.includes(letter) ? (targetWord.includes(letter) ? 'correct' : 'wrong') : ''}`}
              onClick={() => handleGuess(letter)}
              disabled={guessedLetters.includes(letter) || roundStatus !== 'playing'}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games;
