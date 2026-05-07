import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, FiEdit3, FiGlobe, FiMessageCircle, FiBook, 
  FiAward, FiFileText, FiBarChart2, FiMenu, 
  FiX, FiLogOut, FiClock, FiPlay, FiTarget
} from 'react-icons/fi';
import HelpChatbox from '../chat/HelpChatbox';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/correction', icon: <FiEdit3 />, label: 'Sentence Correction' },
    { path: '/translation', icon: <FiGlobe />, label: 'Translation' },
    { path: '/conversation', icon: <FiMessageCircle />, label: 'Conversation' },
    { path: '/vocabulary', icon: <FiBook />, label: 'Vocabulary' },
    { path: '/games', icon: <FiPlay />, label: 'Games' },
    { path: '/missions', icon: <FiTarget />, label: 'Missions' },
    { path: '/badges', icon: <FiAward />, label: 'Badges' },
    { path: '/certificates', icon: <FiFileText />, label: 'Certificates' },
    { path: '/leaderboard', icon: <FiBarChart2 />, label: 'Leaderboard' },
    { path: '/sessions', icon: <FiClock />, label: 'Session History' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="logo">
            <span className="logo-icon">🌍</span>
            <span className="logo-text">LangLearn</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link 
            to="/profile" 
            className={`user-profile ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <div className="user-avatar">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.full_name || user?.username}</span>
              <span className="user-level">{user?.current_level} • {user?.total_xp} XP</span>
            </div>
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
        <HelpChatbox />
      </main>
    </div>
  );
};

export default Layout;
