import React, { useState, useEffect, useRef } from 'react';
import { conversationAPI, sessionAPI } from '../services/api';
import { FiSend, FiRefreshCw, FiMessageCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './FeaturePage.css';
import './Conversation.css';

const Conversation = () => {
  const { user, updateUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [scenario, setScenario] = useState('restaurant');
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [session, setSession] = useState(null);
  const sessionIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  const languages = ['English', 'German', 'Spanish', 'Hindi', 'French', 'Japanese'];

  useEffect(() => {
    fetchScenarios();
    startSession();
    return () => {
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchScenarios = async () => {
    try {
      const response = await conversationAPI.getScenarios();
      const normalized = (response.data || []).map((item) => {
        const name = item.name || 'Casual Conversation';
        const normalizedName = name.toLowerCase();

        let id = 'casual';
        if (normalizedName.includes('restaurant')) id = 'restaurant';
        else if (normalizedName.includes('interview')) id = 'interview';
        else if (normalizedName.includes('travel') || normalizedName.includes('direction')) id = 'travel';
        else if (normalizedName.includes('shopping')) id = 'shopping';

        return {
          id,
          name,
          description: item.description || 'Practice conversation with AI'
        };
      });

      setScenarios(normalized.length > 0 ? normalized : [
        { id: 'restaurant', name: 'Restaurant', description: 'Practice ordering food' },
        { id: 'shopping', name: 'Shopping', description: 'Buy items at a store' },
        { id: 'interview', name: 'Interview', description: 'Practice interview conversations' },
        { id: 'travel', name: 'Travel', description: 'Ask for and give directions' },
        { id: 'casual', name: 'Casual', description: 'Daily life conversation practice' }
      ]);
    } catch (error) {
      // Use default scenarios
      setScenarios([
        { id: 'restaurant', name: 'Restaurant', description: 'Practice ordering food' },
        { id: 'shopping', name: 'Shopping', description: 'Buy items at a store' },
        { id: 'interview', name: 'Interview', description: 'Practice interview conversations' },
        { id: 'travel', name: 'Travel', description: 'Ask for and give directions' },
        { id: 'casual', name: 'Casual', description: 'Daily life conversation practice' }
      ]);
    }
  };

  const startSession = async () => {
    try {
      const response = await sessionAPI.startSession({
        session_type: 'conversation',
        target_language: language,
        difficulty_level: user?.current_level || 'A1',
      });
      setSession(response.data);
      sessionIdRef.current = response.data?.session_id || null;
    } catch (error) {
      console.log('Session optional');
    }
  };

  const endSession = async (sessionId) => {
    try {
      await sessionAPI.endSession(sessionId);
    } catch (error) {
      console.log('Session end error');
    }
  };

  const handleStartScenario = async () => {
    setMessages([]);
    setLoading(true);
    try {
      const response = await conversationAPI.startScenario(scenario);
      setMessages([
        {
          role: 'assistant',
          content: response.data.opening_message || response.data.message || response.data.initial_message || `Welcome! Let's practice a ${scenario} conversation in ${language}.`
        }
      ]);
    } catch (error) {
      setMessages([
        {
          role: 'assistant',
          content: `Welcome! Let's practice a ${scenario} conversation in ${language}. I'll play the role of the service provider. Start by greeting me or making a request.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await conversationAPI.sendMessage({
        message: input,
        language: language,
        scenario: scenario,
        session_id: session?.id
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.ai_response,
        feedback: response.data.feedback,
        corrections: response.data.corrections
      };
      setMessages(prev => [...prev, assistantMessage]);
      // Refresh user data to show updated XP
      await updateUser();
    } catch (error) {
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = async () => {
    setMessages([]);
    try {
      await conversationAPI.resetConversation();
    } catch (error) {
      // Continue anyway
    }
  };

  return (
    <div className="feature-page conversation-page">
      <div className="feature-header">
        <div>
          <h1 className="page-title">Conversation Practice</h1>
          <p className="page-subtitle">Practice real-world scenarios with AI roleplay</p>
        </div>
      </div>

      <div className="conversation-container">
        <div className="conversation-sidebar card">
          <h3>Settings</h3>
          
          <div className="form-group">
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

          <div className="form-group">
            <label className="form-label">Scenario</label>
            <div className="scenario-list">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  className={`scenario-btn ${scenario === s.id ? 'active' : ''}`}
                  onClick={() => setScenario(s.id)}
                >
                  <span className="scenario-name">{s.name}</span>
                  <span className="scenario-desc">{s.description}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary w-full" onClick={handleStartScenario}>
            <FiMessageCircle /> Start Conversation
          </button>

          <button className="btn btn-secondary w-full" onClick={handleReset}>
            <FiRefreshCw /> Reset
          </button>
        </div>

        <div className="chat-container card">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <FiMessageCircle />
                <p>Select a scenario and click "Start Conversation" to begin</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-content">
                    <p>{msg.content}</p>
                    {msg.feedback && (
                      <div className="message-feedback">
                        <strong>Feedback:</strong> {msg.feedback}
                      </div>
                    )}
                    {msg.corrections && msg.corrections.length > 0 && (
                      <div className="message-corrections">
                        <strong>Corrections:</strong>
                        <ul>
                          {msg.corrections.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={messages.length === 0}
            />
            <button 
              className="btn btn-primary send-btn"
              onClick={handleSendMessage}
              disabled={!input.trim() || loading || messages.length === 0}
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
