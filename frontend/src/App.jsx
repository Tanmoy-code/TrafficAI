import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Car, Home as HomeIcon, BarChart3, Clock, Sliders, Info, Users, LogOut, Shield, User, LogIn } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Results from './pages/Results';
import History from './pages/History';
import Settings from './pages/Settings';
import About from './pages/About';
import Login from './pages/Login';
import Manage from './pages/Manage';

function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="nav-brand">
        <div className="nav-brand-icon">
          <Car size={22} />
        </div>
        <span>Traffic<span style={{ color: 'var(--accent-cyan)' }}>AI</span></span>
      </Link>

      <nav>
        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <HomeIcon size={18} /> Home
            </Link>
          </li>
          <li>
            <Link to="/results" className={`nav-link ${location.pathname === '/results' ? 'active' : ''}`}>
              <BarChart3 size={18} /> Analytics
            </Link>
          </li>
          <li>
            <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
              <Clock size={18} /> History
            </Link>
          </li>
          {user?.role === 'admin' && (
            <li>
              <Link to="/manage" className={`nav-link nav-manage-highlight ${location.pathname === '/manage' ? 'active' : ''}`}>
                <Users size={18} /> Manage
              </Link>
            </li>
          )}
          <li>
            <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
              <Sliders size={18} /> Settings
            </Link>
          </li>
          <li>
            <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
              <Info size={18} /> About
            </Link>
          </li>
        </ul>
      </nav>

      <div className="nav-user-controls">
        {user ? (
          <div className="user-profile-widget">
            <span className={`user-badge-pill pill-${user.role}`}>
              {user.role === 'admin' ? <Shield size={13} /> : <User size={13} />}
              <span className="user-name-label">{user.username}</span>
              <span className="user-role-label">({user.role.toUpperCase()})</span>
            </span>
            <button className="logout-btn" onClick={logout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="nav-login-btn">
            <LogIn size={16} /> Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export default function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [settings, setSettings] = useState({
    yolo_conf: 0.30,
    motion_threshold: 0.90,
    padding_percent: 0.15,
    min_crop_px: 120
  });

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navigation />
          
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Home 
                      onAnalysisComplete={(data) => setAnalysisData(data)} 
                      settings={settings}
                    />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/results" 
                element={
                  <ProtectedRoute>
                    <Results analysisData={analysisData} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute>
                    <History onSelectAnalysis={(data) => setAnalysisData(data)} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Manage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings 
                      settings={settings} 
                      onUpdateSettings={(newSet) => setSettings(newSet)} 
                    />
                  </ProtectedRoute>
                } 
              />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>

          <footer className="footer">
            <p>🚗 Traffic Detection & Edge-Sharpness Classification Pipeline © 2026</p>
            <p style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
              Powered by YOLOv8 | React.js Frontend (Port 4000) | Java Backend REST API (Port 5000)
            </p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
