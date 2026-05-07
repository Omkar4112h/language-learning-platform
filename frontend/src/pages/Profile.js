import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { FiUser, FiMail, FiGlobe, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    target_language: '',
    native_language: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const languages = ['English', 'German', 'Spanish', 'Hindi', 'French', 'Japanese'];

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        target_language: user.target_language || 'English',
        native_language: user.native_language || 'English'
      });
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await userAPI.getStatsSummary();
      setStats(response.data);
    } catch (error) {
      console.log('Stats fetch optional');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userAPI.updateProfile(formData);
      await updateUser();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-title-section">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-card card">
            <div className="profile-avatar">
              <span>{user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}</span>
            </div>
            <h2 className="profile-name">{user?.full_name || user?.username}</h2>
            <p className="profile-email">{user?.email}</p>
            
            <div className="profile-level">
              <span className="level-badge">{user?.current_level}</span>
              <span className="xp-count">{user?.total_xp} XP</span>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat">
                <span className="stat-value">{user?.daily_streak || 0}</span>
                <span className="stat-label">Day Streak</span>
              </div>
              <div className="profile-stat">
                <span className="stat-value">{stats?.total_sessions || 0}</span>
                <span className="stat-label">Sessions</span>
              </div>
              <div className="profile-stat">
                <span className="stat-value">{stats?.words_learned || 0}</span>
                <span className="stat-label">Words</span>
              </div>
            </div>
          </div>

          <div className="joined-card card">
            <p>Member since</p>
            <p className="joined-date">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="profile-content card">
          <h3>Edit Profile</h3>
          
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FiUser /> Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  className="form-input"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FiUser /> Username
                </label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Your username"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <FiMail /> Email
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FiGlobe /> Target Language
                </label>
                <select
                  name="target_language"
                  className="form-input form-select"
                  value={formData.target_language}
                  onChange={handleChange}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FiGlobe /> Native Language
                </label>
                <select
                  name="native_language"
                  className="form-input form-select"
                  value={formData.native_language}
                  onChange={handleChange}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
