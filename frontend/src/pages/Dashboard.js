import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, badgeAPI } from '../services/api';
import { FiEdit3, FiGlobe, FiMessageCircle, FiBook, FiAward, FiTrendingUp, FiTarget, FiZap } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBadges, setRecentBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  const fetchDashboardData = useCallback(async ({ showToast = false, force = false } = {}) => {
    const now = Date.now();

    if (inFlightRef.current) return;
    if (!force && now - lastFetchAtRef.current < 60000) return;

    inFlightRef.current = true;
    lastFetchAtRef.current = now;

    try {
      const [statsRes, badgesRes] = await Promise.all([
        userAPI.getStatsSummary(),
        badgeAPI.getMyBadges()
      ]);
      setStats(statsRes.data);
      setRecentBadges(badgesRes.data.slice(0, 4));

      if (showToast && hasLoadedRef.current) {
        toast.info('Stats refreshed');
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchDashboardData({ force: true });
  }, []);

  useEffect(() => {
    const handleFocus = () => fetchDashboardData({ showToast: true });
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData({ showToast: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchDashboardData]);

  const modes = [
    {
      path: '/correction',
      icon: <FiEdit3 />,
      title: 'Sentence Correction',
      description: 'Practice grammar and get instant feedback',
      color: 'blue'
    },
    {
      path: '/translation',
      icon: <FiGlobe />,
      title: 'Translation',
      description: 'Translate between 6 languages',
      color: 'green'
    },
    {
      path: '/conversation',
      icon: <FiMessageCircle />,
      title: 'Conversation',
      description: 'Practice real-world scenarios',
      color: 'purple'
    },
    {
      path: '/vocabulary',
      icon: <FiBook />,
      title: 'Vocabulary',
      description: 'Learn new words with quizzes',
      color: 'orange'
    }
  ];

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const name = user?.full_name?.split(' ')[0] || user?.username || 'Learner';
    
    if (hour < 12) return `Good morning, ${name}! Ready to learn?`;
    if (hour < 17) return `Good afternoon, ${name}! Keep up the great work!`;
    return `Good evening, ${name}! Perfect time to practice!`;
  };

  const calculateXPProgress = () => {
    const levelThresholds = {
      'A1': 0, 'A2': 500, 'B1': 1000, 'B2': 2000, 'C1': 3500, 'C2': 5000
    };
    const nextLevelThresholds = {
      'A1': 500, 'A2': 1000, 'B1': 2000, 'B2': 3500, 'C1': 5000, 'C2': 8000
    };
    
    const currentLevel = user?.current_level || 'A1';
    const currentXP = user?.total_xp || 0;
    const levelStart = levelThresholds[currentLevel];
    const levelEnd = nextLevelThresholds[currentLevel];
    
    const progress = ((currentXP - levelStart) / (levelEnd - levelStart)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="page-title">{getMotivationalMessage()}</h1>
          <p className="page-subtitle">
            Learning {user?.target_language} • Level {user?.current_level}
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-pill">
            <FiZap className="stat-icon" />
            <span>{user?.total_xp || 0} XP</span>
          </div>
          <div className="stat-pill streak">
            <span className="fire">🔥</span>
            <span>{user?.daily_streak || 0} day streak</span>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="xp-progress-card card">
        <div className="xp-header">
          <div className="xp-info">
            <span className="level-badge">{user?.current_level}</span>
            <span className="xp-text">{user?.total_xp} XP</span>
          </div>
          <span className="next-level">Next: {user?.current_level === 'C2' ? 'Max Level!' : `Level ${['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(user?.current_level) + 1]}`}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${calculateXPProgress()}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <FiTarget className="stat-card-icon" />
          <div className="stat-value">{stats?.total_sessions || 0}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-card">
          <FiTrendingUp className="stat-card-icon" />
          <div className="stat-value">{stats?.accuracy?.toFixed(1) || 0}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <FiBook className="stat-card-icon" />
          <div className="stat-value">{stats?.words_learned || 0}</div>
          <div className="stat-label">Words Learned</div>
        </div>
        <div className="stat-card">
          <FiAward className="stat-card-icon" />
          <div className="stat-value">{recentBadges.length}</div>
          <div className="stat-label">Badges</div>
        </div>
      </div>

      {/* Learning Modes */}
      <div className="section">
        <h2 className="section-title">Start Learning</h2>
        <div className="modes-grid">
          {modes.map((mode) => (
            <Link key={mode.path} to={mode.path} className={`mode-card mode-${mode.color}`}>
              <div className="mode-icon">{mode.icon}</div>
              <h3>{mode.title}</h3>
              <p>{mode.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Your Badges</h2>
            <Link to="/badges" className="view-all">View All</Link>
          </div>
          <div className="badges-grid">
            {recentBadges.map((ub, index) => (
              <div key={index} className="badge-card">
                <span className="badge-icon">{ub.badge?.icon}</span>
                <span className="badge-name">{ub.badge?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
