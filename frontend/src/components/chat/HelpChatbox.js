import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMessageSquare, FiX, FiSend, FiZap, FiMic, FiMicOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import './HelpChatbox.css';

const BOT_NAME = 'LangLearn AI Helper';

const pageHints = {
  '/dashboard': 'I can explain your XP progress and what to do next.',
  '/correction': 'Ask me why a sentence is wrong and how to improve it.',
  '/translation': 'Ask for translation tips and examples.',
  '/conversation': 'Ask for better phrases and fluency suggestions.',
  '/vocabulary': 'Ask for memory tricks and practice methods.',
  '/games': 'Ask for game strategies to score better.',
  '/missions': 'Ask for mission dialog examples before you start.',
  '/badges': 'Ask how to unlock specific badges faster.',
  '/certificates': 'Ask what you need for your next certificate.',
  '/leaderboard': 'Ask how to gain XP efficiently.',
  '/sessions': 'Ask what your session stats mean.',
  '/profile': 'Ask how to improve your overall learning profile.'
};

const HelpChatbox = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi. I am your AI study assistant. Ask me for grammar help, translation tips, mission strategy, or quick feedback on what to practice next.'
    }
  ]);

  const messagesRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceEnabledRef = useRef(true);

  const speechRecognitionSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
  const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const hintText = useMemo(() => pageHints[location.pathname] || 'Ask me anything about learning on this page.', [location.pathname]);

  const speakText = (text) => {
    if (!speechSynthesisSupported || !text) return;
    if (!voiceEnabledRef.current) return;

    // Stop any current speech and reset engine (fixes Chrome stuck states)
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      window.speechSynthesis.resume();
    } catch (e) {
      // ignore
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      utterance.voice = voices[0];
    }

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;

    if (!speechSynthesisSupported) return;

    if (!voiceEnabled) {
      window.speechSynthesis.cancel();
    } else {
      // Warm up voices + ensure we are not left paused
      window.speechSynthesis.resume();
      window.speechSynthesis.getVoices();
    }
  }, [voiceEnabled, speechSynthesisSupported]);

  useEffect(() => {
    if (!speechSynthesisSupported) return;
    // Fix voice loading issue (Chrome bug)
    window.speechSynthesis.getVoices();
  }, [speechSynthesisSupported]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!speechRecognitionSupported) {
      return undefined;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript.trim()));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [speechRecognitionSupported]);

  useEffect(() => () => {
    if (speechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
  }, [speechSynthesisSupported]);

  const typeMessage = async (text) => {
  let current = "";

  // add empty message first
  const id = `assistant-${Date.now()}`;
  setMessages(prev => [...prev, { id, role: "assistant", text: "" }]);

  for (let char of text) {
    current += char;

    await new Promise(res => setTimeout(res, 15)); // typing speed

    setMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, text: current } : msg
      )
    );
  }

  speakText(text);
};

  const toggleListening = () => {
    if (!speechRecognitionSupported || !recognitionRef.current || loading) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      setIsListening(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const contextualMessage = `[Current page: ${location.pathname}] ${trimmed}`;
      // Use relative URL so CRA dev proxy forwards to backend without CORS issues.
     const res = await fetch('http://127.0.0.1:8000/api/ai/chat', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       message: contextualMessage
     })
   });

      if (!res.ok) {
        throw new Error(`AI help failed (${res.status})`);
      }

      const data = await res.json();
      await typeMessage(data.reply || 'No response from AI');
    } catch (error) {
      await typeMessage('I am having trouble connecting right now. Please retry in a few seconds.');
    } finally {
      setLoading(false);
    }
  };

  const onInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="help-chatbox-wrapper">
      {isOpen && (
        <div className="help-chatbox-panel animate-slideUp" aria-live="polite">
          <div className="help-chatbox-header">
            <div className="help-chatbox-title-wrap">
              <div className="help-chatbox-badge"><FiZap /></div>
              <div>
                <h3>{BOT_NAME}</h3>
                <p>{hintText}</p>
              </div>
            </div>
            <button
              type="button"
              className="help-chatbox-icon-btn"
              onClick={() => {
                setVoiceEnabled((prev) => {
                  const next = !prev;

                  // Keep the ref in sync immediately (avoids async stale state)
                  voiceEnabledRef.current = next;

                  if (!speechSynthesisSupported) {
                    return next;
                  }

                  try {
                    if (!next) {
                      window.speechSynthesis.cancel();
                    } else {
                      // IMPORTANT: do this inside the click handler (user gesture)
                      // so Chrome reliably allows speech after being muted.
                      window.speechSynthesis.resume();
                      window.speechSynthesis.getVoices();

                      // "Unlock" speech synthesis with a silent utterance.
                      // Some browsers refuse to speak later if not primed by a user gesture.
                      const unlock = new SpeechSynthesisUtterance('.');
                      unlock.volume = 0;
                      window.speechSynthesis.speak(unlock);
                      window.speechSynthesis.cancel();
                    }
                  } catch (e) {
                    // ignore
                  }

                  return next;
                });
              }}
              aria-label={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
              title={voiceEnabled ? 'Voice is on' : 'Voice is off'}
            >
              {voiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
            </button>
            <button
              type="button"
              className="help-chatbox-icon-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI helper"
            >
              <FiX />
            </button>
          </div>

          <div className="help-chatbox-messages" ref={messagesRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`help-chatbox-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="help-chatbox-message assistant typing">
                Thinking...
              </div>
            )}
          </div>

          <div className="help-chatbox-input-wrap">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              rows={2}
              placeholder="Ask for quick help..."
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleListening}
              disabled={!speechRecognitionSupported || loading}
              className={`help-chatbox-voice-btn ${isListening ? 'listening' : ''}`}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              title={speechRecognitionSupported ? 'Voice input' : 'Voice input not supported in this browser'}
            >
              {isListening ? <FiMicOff /> : <FiMic />}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="help-chatbox-send-btn"
              aria-label="Send message"
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="help-chatbox-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Hide AI helper' : 'Open AI helper'}
      >
        {isOpen ? <FiX /> : <FiMessageSquare />}
        <span>AI Help</span>
      </button>
    </div>
  );
};

export default HelpChatbox;
