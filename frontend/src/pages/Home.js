import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiGlobe, FiAward, FiBook, FiMessageCircle } from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: <FiBook />,
      title: 'Sentence Correction',
      description: 'Get instant grammar and vocabulary feedback with detailed explanations'
    },
    {
      icon: <FiGlobe />,
      title: 'Translation',
      description: 'Translate text between 6 languages with context and alternatives'
    },
    {
      icon: <FiMessageCircle />,
      title: 'Conversation Practice',
      description: 'Practice real-world scenarios with AI-powered roleplay'
    },
    {
      icon: <FiAward />,
      title: 'Gamified Learning',
      description: 'Earn XP, badges, and certificates as you progress'
    }
  ];

  const languages = ['English', 'German', 'Spanish', 'Hindi', 'French', 'Japanese'];

  const levels = [
    { code: 'A1', name: 'Beginner', xp: '0-500 XP' },
    { code: 'A2', name: 'Elementary', xp: '500-1000 XP' },
    { code: 'B1', name: 'Intermediate', xp: '1000-2000 XP' },
    { code: 'B2', name: 'Upper Intermediate', xp: '2000-3500 XP' },
    { code: 'C1', name: 'Advanced', xp: '3500-5000 XP' },
    { code: 'C2', name: 'Proficient', xp: '5000+ XP' }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <nav className="home-nav">
          <div className="logo">
            <span className="logo-icon">🌍</span>
            <span className="logo-text">LangLearn</span>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </nav>

        <div className="hero-content">
          <h1 className="hero-title">
            Master Any Language with <span className="highlight">AI-Powered</span> Learning
          </h1>
          <p className="hero-subtitle">
            Interactive lessons, real-time feedback, gamified progress tracking, and professional certificates. 
            Learn 6 languages at your own pace.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Learning Free <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              I Have an Account
            </Link>
          </div>

          <div className="hero-languages">
            {languages.map((lang) => (
              <span key={lang} className="language-tag">{lang}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Everything You Need to Learn</h2>
          <p className="section-subtitle">
            Our AI-powered platform adapts to your level and helps you improve faster
          </p>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section className="levels">
        <div className="container">
          <h2 className="section-title">CEFR-Based Level System</h2>
          <p className="section-subtitle">
            Progress through internationally recognized language levels
          </p>
          
          <div className="levels-grid">
            {levels.map((level) => (
              <div key={level.code} className="level-card">
                <div className="level-code">{level.code}</div>
                <div className="level-name">{level.name}</div>
                <div className="level-xp">{level.xp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-content">
            <h2>Why Choose LangLearn?</h2>
            <ul className="benefits-list">
              <li><FiCheck /> Real-time grammar and vocabulary correction</li>
              <li><FiCheck /> AI-powered conversation practice</li>
              <li><FiCheck /> Gamified learning with XP and badges</li>
              <li><FiCheck /> Professional certificates upon completion</li>
              <li><FiCheck /> Daily streak tracking for consistent practice</li>
              <li><FiCheck /> Support for 6 major languages</li>
            </ul>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Your Journey <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-icon">🌍</span>
              <span className="logo-text">LangLearn</span>
            </div>
            <p>AI-Powered Language Learning Platform</p>
            <p className="copyright">© 2024 LangLearn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
