import React, { useState, useEffect, useRef } from 'react';
import { correctionAPI, sessionAPI } from '../services/api';
import { FiCheck, FiX, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './FeaturePage.css';

const SentenceCorrection = () => {
  const { user, updateUser } = useAuth();
  const [sentence, setSentence] = useState('');
  const [language, setLanguage] = useState('English');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const sessionIdRef = useRef(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, xp: 0 });

  const languages = ['English', 'German', 'Spanish', 'Hindi', 'French', 'Japanese'];

  useEffect(() => {
    startSession();
    return () => {
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current);
      }
    };
  }, []);

  const startSession = async () => {
    try {
      const response = await sessionAPI.startSession({
        session_type: 'correction',
        target_language: language,
        difficulty_level: user?.current_level || 'A1',
      });
      setSession(response.data);
      sessionIdRef.current = response.data?.session_id || null;
    } catch (error) {
      console.log('Session start optional');
    }
  };

  const endSession = async (sessionId) => {
    try {
      await sessionAPI.endSession(sessionId);
    } catch (error) {
      console.log('Session end error');
    }
  };

  const handleCheck = async () => {
    if (!sentence.trim()) {
      toast.warning('Please enter a sentence to check');
      return;
    }

    setLoading(true);
    try {
      const response = await correctionAPI.checkSentence({
        sentence: sentence,
        target_language: language,
        user_level: 'A1'
      });
      setResult(response.data);

      // Update session stats
      if (!response.data.has_errors) {
        setSessionStats(prev => ({
          ...prev,
          correct: prev.correct + 1,
          xp: prev.xp + (response.data.xp_earned || 0)
        }));
      } else {
        setSessionStats(prev => ({
          ...prev,
          wrong: prev.wrong + 1,
          xp: prev.xp + (response.data.xp_earned || 0)
        }));
      }
      // Refresh user data to show updated XP
      await updateUser();
    } catch (error) {
      toast.error('Failed to check sentence');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSentence('');
    setResult(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCheck();
    }
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <h1 className="page-title">Sentence Correction</h1>
          <p className="page-subtitle">Get instant grammar and vocabulary feedback</p>
        </div>
        <div className="session-stats">
          <span className="stat correct">{sessionStats.correct} correct</span>
          <span className="stat wrong">{sessionStats.wrong} wrong</span>
          <span className="stat xp">+{sessionStats.xp} XP</span>
        </div>
      </div>

      <div className="feature-content">
        <div className="input-section card">
          <div className="input-header">
            <label className="form-label">Your Sentence</label>
            <select
              className="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          
          <textarea
            className="sentence-input"
            placeholder="Type a sentence to check for grammar and vocabulary errors..."
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={4}
          />

          <div className="input-actions">
            <button className="btn btn-secondary" onClick={handleClear}>
              <FiRefreshCw /> Clear
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleCheck}
              disabled={loading || !sentence.trim()}
            >
              {loading ? 'Checking...' : 'Check Sentence'}
              {!loading && <FiArrowRight />}
            </button>
          </div>
        </div>

        {result && (
          <div className={`result-section card ${!result.has_errors ? 'result-correct' : 'result-incorrect'}`}>
            <div className="result-header">
              <div className={`result-badge ${!result.has_errors ? 'badge-success' : 'badge-error'}`}>
                {!result.has_errors ? <FiCheck /> : <FiX />}
                {!result.has_errors ? 'Correct!' : 'Needs Correction'}
              </div>
              {result.xp_earned > 0 ? (
                <span className="xp-badge success">+{result.xp_earned} XP</span>
              ) : (
                <span className="xp-badge">+0 XP</span>
              )}
            </div>

            {result.has_errors && result.corrected_sentence && (
              <div className="correction-box">
                <label>Corrected Sentence:</label>
                <p className="corrected-text">{result.corrected_sentence}</p>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="errors-section">
                <label>Issues Found:</label>
                <ul className="errors-list">
                  {result.errors.map((error, index) => (
                    <li key={index} className="error-item">
                      <span className="error-type">{error.type}</span>
                      <span className="error-text">{error.original} → {error.correction}</span>
                      {error.explanation && (
                        <p className="error-explanation">{error.explanation}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.explanation && (
              <div className="feedback-box">
                <label>Feedback:</label>
                <p>{result.explanation}</p>
              </div>
            )}
          </div>
        )}

        <div className="tips-card card">
          <h3>Tips for Better Writing</h3>
          <ul>
            <li>Check subject-verb agreement</li>
            <li>Use correct verb tenses consistently</li>
            <li>Watch for common spelling mistakes</li>
            <li>Use proper punctuation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SentenceCorrection;
