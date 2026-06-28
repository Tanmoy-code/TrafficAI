import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Car, Home as HomeIcon, BarChart3, Sliders, Info } from 'lucide-react';

import Home from './pages/Home';
import Results from './pages/Results';
import Settings from './pages/Settings';
import About from './pages/About';

function Navigation() {
  const location = useLocation();

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
    <Router>
      <div className="app-container">
        <Navigation />
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  onAnalysisComplete={(data) => setAnalysisData(data)} 
                  settings={settings}
                />
              } 
            />
            <Route 
              path="/results" 
              element={<Results analysisData={analysisData} />} 
            />
            <Route 
              path="/settings" 
              element={
                <Settings 
                  settings={settings} 
                  onUpdateSettings={(newSet) => setSettings(newSet)} 
                />
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
  );
}
