import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Eye, EyeOff, KeyRound, Trash2, Shield, User, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function Manage() {
  const { token } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Visible password toggles map (userId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [submitting, setSubmitting] = useState(false);

  // Edit Password Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [updatedPassword, setUpdatedPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && Array.isArray(data)) {
        setUsersList(data);
      } else {
        setError(data.error || 'Failed to load users list.');
      }
    } catch (err) {
      setLoading(false);
      setError('Error connecting to database endpoint.');
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole
        })
      });
      const data = await res.json();
      setSubmitting(false);

      if (res.ok && data.success) {
        setSuccessMsg(`User '${newUsername}' successfully added to database!`);
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user.');
      }
    } catch (err) {
      setSubmitting(false);
      setError('Connection error while adding user.');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!editingUser || !updatedPassword) return;
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingUser.id,
          password: updatedPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Password for user '${editingUser.username}' updated!`);
        setEditingUser(null);
        setUpdatedPassword('');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setError('Connection error updating password.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user '${username}' from database?`)) return;
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`http://localhost:5000/api/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User '${username}' deleted from database.`);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      setError('Connection error deleting user.');
    }
  };

  return (
    <div className="manage-page-container">
      <div className="manage-header">
        <div className="manage-title-box">
          <div className="manage-icon-bg">
            <Users size={28} />
          </div>
          <div>
            <h2>Admin User Management</h2>
            <p>Strict Database Credential Administration & Password Control</p>
          </div>
        </div>

        <button className="refresh-btn" onClick={fetchUsers} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh List
        </button>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-box alert-success">
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="manage-grid">
        {/* Add User Card */}
        <div className="manage-card add-user-card">
          <div className="card-header">
            <UserPlus size={22} className="card-header-icon" />
            <h3>Add New Credentials</h3>
          </div>
          <form onSubmit={handleAddUser} className="manage-form">
            <div className="form-group">
              <label htmlFor="new-username">Username</label>
              <input 
                id="new-username"
                type="text" 
                placeholder="Enter username" 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">Password</label>
              <input 
                id="new-password"
                type="text" 
                placeholder="Enter password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-role">System Panel Role</label>
              <select 
                id="new-role"
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="user">User Panel (Standard)</option>
                <option value="admin">Admin Panel (Administrator)</option>
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              <UserPlus size={18} /> {submitting ? 'Saving to Database...' : 'Save User to Database'}
            </button>
          </form>
        </div>

        {/* Database Users Table Card */}
        <div className="manage-card users-list-card">
          <div className="card-header">
            <Users size={22} className="card-header-icon" />
            <h3>Database Registered Accounts ({usersList.length})</h3>
          </div>

          {loading ? (
            <div className="loading-state">Loading credentials from database...</div>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role Panel</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isVisible = !!visiblePasswords[u.id];
                    return (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td>
                          <strong className="user-name-cell">{u.username}</strong>
                        </td>
                        <td>
                          <div className="password-cell">
                            <span className="password-text">
                              {isVisible ? u.password : '••••••••••••'}
                            </span>
                            <button 
                              type="button" 
                              className="eye-toggle-btn"
                              title={isVisible ? 'Hide Password' : 'View Password'}
                              onClick={() => togglePasswordVisibility(u.id)}
                            >
                              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge role-${u.role}`}>
                            {u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="date-cell">{u.created_at || 'System Seed'}</td>
                        <td>
                          <div className="action-btns">
                            <button 
                              type="button" 
                              className="action-btn edit-btn" 
                              title="Change Password"
                              onClick={() => {
                                setEditingUser(u);
                                setUpdatedPassword(u.password);
                              }}
                            >
                              <KeyRound size={15} /> Edit
                            </button>
                            {u.username !== 'admin' && (
                              <button 
                                type="button" 
                                className="action-btn delete-btn" 
                                title="Delete User"
                                onClick={() => handleDeleteUser(u.id, u.username)}
                              >
                                <Trash2 size={15} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Password Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Password for '{editingUser.username}'</h3>
            </div>
            <form onSubmit={handleUpdatePassword} className="modal-form">
              <div className="form-group">
                <label htmlFor="modal-password">New Password</label>
                <input 
                  id="modal-password"
                  type="text" 
                  value={updatedPassword}
                  onChange={(e) => setUpdatedPassword(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Update Password in Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
