import React, { useEffect, useRef, useState } from 'react';
import { translationAPI, sessionAPI } from '../services/api';
import { FiArrowRight, FiCopy, FiRefreshCw, FiRepeat, FiVolume2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './FeaturePage.css';

const Translation = () => {
  const { user, updateUser } = useAuth();
  const [session, setSession] = useState(null);
  const sessionIdRef = useRef(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

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
        session_type: 'translation',
        target_language: targetLang,
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

  // Language codes for speech synthesis
  const speechLangCodes = {
    'English': 'en-US',
    'German': 'de-DE',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'Hindi': 'hi-IN',
    'Japanese': 'ja-JP'
  };

  const speak = (text, language) => {
    if (!text || speaking) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLangCodes[language] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      toast.error('Speech not available for this language');
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.warning('Please enter text to translate');
      return;
    }

    if (sourceLang === targetLang) {
      toast.warning('Please select different languages');
      return;
    }

    setLoading(true);
    try {
      const response = await translationAPI.translate({
        text: sourceText,
        source_language: sourceLang,
        target_language: targetLang
      });
      setResult(response.data);
      toast.success('+5 XP earned!');
      // Refresh user data to show updated XP
      await updateUser();
    } catch (error) {
      toast.error('Failed to translate');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    if (result?.translated_text) {
      setSourceText(result.translated_text);
      setResult(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleClear = () => {
    setSourceText('');
    setResult(null);
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <h1 className="page-title">Translation</h1>
          <p className="page-subtitle">Translate text between 6 languages</p>
        </div>
      </div>

      <div className="translation-container">
        <div className="translation-panel card">
          <div className="panel-header">
            <select
              className="language-select"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <textarea
            className="translation-input"
            placeholder="Enter text to translate..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={6}
          />
          <div className="panel-footer">
            <span className="char-count">{sourceText.length} / 5000</span>
            <div className="footer-actions">
              {sourceText && (
                <button 
                  className={`btn-icon ${speaking ? 'speaking' : ''}`}
                  onClick={() => speaking ? stopSpeaking() : speak(sourceText, sourceLang)} 
                  title={speaking ? "Stop" : "Listen"}
                >
                  <FiVolume2 />
                </button>
              )}
              <button className="btn-icon" onClick={handleClear} title="Clear">
                <FiRefreshCw />
              </button>
            </div>
          </div>
        </div>

        <div className="translation-controls">
          <button className="swap-btn" onClick={handleSwapLanguages} title="Swap Languages">
            <FiRepeat />
          </button>
          <button 
            className="btn btn-primary translate-btn" 
            onClick={handleTranslate}
            disabled={loading || !sourceText.trim()}
          >
            {loading ? 'Translating...' : 'Translate'}
            {!loading && <FiArrowRight />}
          </button>
        </div>

        <div className="translation-panel card">
          <div className="panel-header">
            <select
              className="language-select"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="translation-output">
            {result?.translated_text ? (
              <p>{result.translated_text}</p>
            ) : (
              <p className="placeholder-text">Translation will appear here...</p>
            )}
          </div>
          <div className="panel-footer">
            {result?.translated_text && (
              <div className="footer-actions">
                <button 
                  className={`btn-icon ${speaking ? 'speaking' : ''}`}
                  onClick={() => speaking ? stopSpeaking() : speak(result.translated_text, targetLang)} 
                  title={speaking ? "Stop" : "Listen"}
                >
                  <FiVolume2 />
                </button>
                <button 
                  className="btn-icon" 
                  onClick={() => handleCopy(result.translated_text)}
                  title="Copy"
                >
                  <FiCopy />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {result?.alternative_variations && result.alternative_variations.length > 0 && (
        <div className="alternatives-section card">
          <h3>Alternative Translations</h3>
          <div className="alternatives-list">
            {result.alternative_variations.map((alt, index) => (
              <div key={index} className="alternative-item">
                <p>{alt}</p>
                <button 
                  className="btn-icon" 
                  onClick={() => handleCopy(alt)}
                >
                  <FiCopy />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.contextual_explanation && (
        <div className="context-section card">
          <h3>Usage Context</h3>
          <p>{result.contextual_explanation}</p>
        </div>
      )}
    </div>
  );
};

export default Translation;
