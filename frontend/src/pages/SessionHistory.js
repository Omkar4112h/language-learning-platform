import React, { useState, useEffect } from 'react';
import { sessionAPI } from '../services/api';
import { FiClock, FiCheck, FiX, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './SessionHistory.css';

const SessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      // Note: This would need a backend endpoint for session history
      // For now, using mock data
      setSessions([
        {
          id: 1,
          session_type: 'correction',
          language: 'English',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          ended_at: new Date(Date.now() - 3000000).toISOString(),
          total_xp: 50,
          correct_count: 4,
          wrong_count: 1
        },
        {
          id: 2,
          session_type: 'vocabulary',
          language: 'Spanish',
          started_at: new Date(Date.now() - 86400000).toISOString(),
          ended_at: new Date(Date.now() - 85800000).toISOString(),
          total_xp: 80,
          correct_count: 8,
          wrong_count: 2
        },
        {
          id: 3,
          session_type: 'conversation',
          language: 'German',
          started_at: new Date(Date.now() - 172800000).toISOString(),
          ended_at: new Date(Date.now() - 172200000).toISOString(),
          total_xp: 30,
          correct_count: 3,
          wrong_count: 0
        }
      ]);
    } catch (error) {
      toast.error('Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async (sessionId) => {
    try {
      const response = await sessionAPI.getInteractions(sessionId);
      setInteractions(response.data);
    } catch (error) {
      // Use mock data
      setInteractions([
        { type: 'question', content: 'She go to school every day.', is_correct: false },
        { type: 'answer', content: 'She goes to school every day.', is_correct: true },
        { type: 'question', content: 'I am learning English.', is_correct: true }
      ]);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    fetchInteractions(session.id);
  };

  const formatDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) {
      return 'Today';
    } else if (diff < 172800000) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'correction': return '✏️';
      case 'vocabulary': return '📚';
      case 'conversation': return '💬';
      case 'translation': return '🌐';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="session-history-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading session history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="session-history-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Session History</h1>
          <p className="page-subtitle">Review your past learning sessions</p>
        </div>
      </div>

      <div className="history-container">
        <div className="sessions-list card">
          <h3>Recent Sessions</h3>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>No sessions yet. Start learning to see your history!</p>
            </div>
          ) : (
            <div className="sessions">
              {sessions.map(session => (
                <div 
                  key={session.id}
                  className={`session-item ${selectedSession?.id === session.id ? 'active' : ''}`}
                  onClick={() => handleSelectSession(session)}
                >
                  <div className="session-icon">{getTypeIcon(session.session_type)}</div>
                  <div className="session-info">
                    <div className="session-title">
                      {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)}
                      <span className="session-lang">{session.language}</span>
                    </div>
                    <div className="session-meta">
                      <span>{formatDate(session.started_at)}</span>
                      <span><FiClock /> {formatDuration(session.started_at, session.ended_at)}</span>
                    </div>
                  </div>
                  <div className="session-stats">
                    <span className="xp-earned">+{session.total_xp} XP</span>
                    <FiChevronRight />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="session-details card">
          {selectedSession ? (
            <>
              <div className="details-header">
                <span className="detail-icon">{getTypeIcon(selectedSession.session_type)}</span>
                <div>
                  <h3>{selectedSession.session_type.charAt(0).toUpperCase() + selectedSession.session_type.slice(1)} Session</h3>
                  <p>{selectedSession.language} • {formatDate(selectedSession.started_at)}</p>
                </div>
              </div>

              <div className="details-stats">
                <div className="detail-stat">
                  <span className="stat-value">{selectedSession.total_xp}</span>
                  <span className="stat-label">XP Earned</span>
                </div>
                <div className="detail-stat correct">
                  <span className="stat-value">{selectedSession.correct_count}</span>
                  <span className="stat-label">Correct</span>
                </div>
                <div className="detail-stat wrong">
                  <span className="stat-value">{selectedSession.wrong_count}</span>
                  <span className="stat-label">Wrong</span>
                </div>
                <div className="detail-stat">
                  <span className="stat-value">
                    {formatDuration(selectedSession.started_at, selectedSession.ended_at)}
                  </span>
                  <span className="stat-label">Duration</span>
                </div>
              </div>

              {interactions.length > 0 && (
                <div className="interactions-section">
                  <h4>Session Activity</h4>
                  <div className="interactions-list">
                    {interactions.map((interaction, index) => (
                      <div key={index} className={`interaction-item ${interaction.is_correct ? 'correct' : 'incorrect'}`}>
                        <span className="interaction-icon">
                          {interaction.is_correct ? <FiCheck /> : <FiX />}
                        </span>
                        <p>{interaction.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>Select a session to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
