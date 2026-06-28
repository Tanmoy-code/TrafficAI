import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="unauthorized-container" style={{
        padding: '3rem',
        textAlign: 'center',
        background: 'var(--card-bg, rgba(20, 25, 35, 0.7))',
        borderRadius: '16px',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        margin: '2rem auto',
        maxWidth: '600px',
        backdropFilter: 'blur(10px)'
      }}>
        <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Access Denied (Admin Only)</h2>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>
          You are currently logged in as <strong>{user.username}</strong> ({user.role.toUpperCase()} panel). 
          The User Management panel is restricted strictly to Administrator accounts.
        </p>
      </div>
    );
  }

  return children;
}
