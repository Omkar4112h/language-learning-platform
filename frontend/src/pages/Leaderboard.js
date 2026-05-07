import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { FiTrendingUp, FiAward, FiZap } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // 'all', 'weekly', 'monthly'

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getLeaderboard({ limit: 50, timeframe });
      setLeaderboard(response.data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
      // Set sample data
      setLeaderboard([
        { rank: 1, username: 'LanguageMaster', total_xp: 15000, current_level: 'C2', daily_streak: 45 },
        { rank: 2, username: 'PolyglotPro', total_xp: 12500, current_level: 'C1', daily_streak: 30 },
        { rank: 3, username: 'WordWizard', total_xp: 10000, current_level: 'C1', daily_streak: 25 },
        { rank: 4, username: 'GrammarGuru', total_xp: 8000, current_level: 'B2', daily_streak: 20 },
        { rank: 5, username: 'LingualLearner', total_xp: 6500, current_level: 'B2', daily_streak: 15 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">See how you rank against other learners</p>
        </div>
        <div className="timeframe-selector">
          <button 
            className={`timeframe-btn ${timeframe === 'all' ? 'active' : ''}`}
            onClick={() => setTimeframe('all')}
          >
            All Time
          </button>
          <button 
            className={`timeframe-btn ${timeframe === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeframe('monthly')}
          >
            This Month
          </button>
          <button 
            className={`timeframe-btn ${timeframe === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeframe('weekly')}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="podium">
          <div className="podium-item second">
            <div className="podium-avatar">
              {leaderboard[1]?.username?.charAt(0)}
            </div>
            <span className="podium-rank">🥈</span>
            <span className="podium-name">{leaderboard[1]?.username}</span>
            <span className="podium-xp">{leaderboard[1]?.total_xp} XP</span>
          </div>
          <div className="podium-item first">
            <div className="podium-avatar crown">
              {leaderboard[0]?.username?.charAt(0)}
            </div>
            <span className="podium-rank">🥇</span>
            <span className="podium-name">{leaderboard[0]?.username}</span>
            <span className="podium-xp">{leaderboard[0]?.total_xp} XP</span>
          </div>
          <div className="podium-item third">
            <div className="podium-avatar">
              {leaderboard[2]?.username?.charAt(0)}
            </div>
            <span className="podium-rank">🥉</span>
            <span className="podium-name">{leaderboard[2]?.username}</span>
            <span className="podium-xp">{leaderboard[2]?.total_xp} XP</span>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="leaderboard-table card">
        <div className="table-header">
          <span className="col-rank">Rank</span>
          <span className="col-user">User</span>
          <span className="col-level">Level</span>
          <span className="col-streak">Streak</span>
          <span className="col-xp">XP</span>
        </div>
        
        <div className="table-body">
          {leaderboard.map((user, index) => (
            <div 
              key={user.username || index} 
              className={`table-row ${getRankClass(user.rank || index + 1)}`}
            >
              <span className="col-rank">
                <span className="rank-icon">{getRankIcon(user.rank || index + 1)}</span>
              </span>
              <span className="col-user">
                <div className="user-avatar">
                  {user.username?.charAt(0)}
                </div>
                <span className="user-name">{user.username}</span>
              </span>
              <span className="col-level">
                <span className="level-badge">{user.current_level}</span>
              </span>
              <span className="col-streak">
                <span className="streak-badge">🔥 {user.daily_streak}</span>
              </span>
              <span className="col-xp">
                <FiZap className="xp-icon" />
                {user.total_xp?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
