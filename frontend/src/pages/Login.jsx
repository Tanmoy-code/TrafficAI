import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, UserCheck, AlertCircle, LogIn } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  const fillCredentials = (userRole) => {
    if (userRole === 'admin') {
      setUsername('admin');
      setPassword('Colon#2420');
    } else {
      setUsername('user');
      setPassword('user123');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-badge">
            <Lock size={32} />
          </div>
          <h2>Authentication Panel</h2>
          <p>Strict Database Login System</p>
        </div>

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            <LogIn size={20} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="demo-credentials-section">
          <p className="demo-title">Quick Demo Login Presets:</p>
          <div className="demo-btns">
            <button 
              type="button" 
              className="demo-preset-btn admin-preset"
              onClick={() => fillCredentials('admin')}
            >
              <ShieldCheck size={16} /> Admin Panel (admin)
            </button>
            <button 
              type="button" 
              className="demo-preset-btn user-preset"
              onClick={() => fillCredentials('user')}
            >
              <UserCheck size={16} /> User Panel (user)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
