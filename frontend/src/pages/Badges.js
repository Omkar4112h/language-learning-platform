import React, { useState, useEffect } from 'react';
import { badgeAPI } from '../services/api';
import { FiAward, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Badges.css';

const Badges = () => {
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        badgeAPI.getAllBadges(),
        badgeAPI.getMyBadges()
      ]);
      setAllBadges(allRes.data);
      setMyBadges(myRes.data.map(ub => ub.badge?.id || ub.badge_id));
    } catch (error) {
      toast.error('Failed to load badges');
      // Set default badges
      setAllBadges([
        { id: 1, name: 'First Steps', description: 'Complete your first session', icon: '🎯' },
        { id: 2, name: 'Word Collector', description: 'Learn 50 vocabulary words', icon: '📚' },
        { id: 3, name: 'Grammar Guru', description: 'Correct 100 sentences', icon: '✏️' },
        { id: 4, name: 'Polyglot', description: 'Practice in 3 different languages', icon: '🌍' },
        { id: 5, name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥' },
        { id: 6, name: 'Conversation Pro', description: 'Complete 20 conversations', icon: '💬' },
        { id: 7, name: 'XP Hunter', description: 'Earn 1000 XP', icon: '⚡' },
        { id: 8, name: 'Perfectionist', description: 'Get 10 perfect scores in a row', icon: '🏆' },
        { id: 9, name: 'Night Owl', description: 'Practice after 10 PM', icon: '🦉' },
        { id: 10, name: 'Early Bird', description: 'Practice before 8 AM', icon: '🌅' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const earnedCount = myBadges.length;
  const totalCount = allBadges.length;

  if (loading) {
    return (
      <div className="badges-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="badges-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Badges</h1>
          <p className="page-subtitle">Track your achievements and milestones</p>
        </div>
        <div className="badge-summary">
          <FiAward />
          <span>{earnedCount} / {totalCount} Earned</span>
        </div>
      </div>

      <div className="badges-progress card">
        <div className="progress-header">
          <span>Collection Progress</span>
          <span>{Math.round((earnedCount / totalCount) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="badges-grid">
        {allBadges.map(badge => {
          const isEarned = myBadges.includes(badge.id);
          return (
            <div 
              key={badge.id} 
              className={`badge-item card ${isEarned ? 'earned' : 'locked'}`}
            >
              <div className="badge-icon-container">
                {isEarned ? (
                  <span className="badge-icon">{badge.icon}</span>
                ) : (
                  <span className="badge-icon locked-icon">
                    <FiLock />
                  </span>
                )}
              </div>
              <h3 className="badge-name">{badge.name}</h3>
              <p className="badge-description">{badge.description}</p>
              {isEarned && (
                <span className="earned-label">Earned!</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Badges;
