import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SentenceCorrection from './pages/SentenceCorrection';
import Translation from './pages/Translation';
import Conversation from './pages/Conversation';
import VocabularyBuilder from './pages/VocabularyBuilder';
import Profile from './pages/Profile';
import Badges from './pages/Badges';
import Certificates from './pages/Certificates';
import Leaderboard from './pages/Leaderboard';
import SessionHistory from './pages/SessionHistory';
import Games from './pages/Games';
import Missions from './pages/Missions';

import './App.css';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/correction" element={<SentenceCorrection />} />
            <Route path="/translation" element={<Translation />} />
            <Route path="/conversation" element={<Conversation />} />
            <Route path="/vocabulary" element={<VocabularyBuilder />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/sessions" element={<SessionHistory />} />
            <Route path="/games" element={<Games />} />
            <Route path="/missions" element={<Missions />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
