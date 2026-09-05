import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/admin/users');
      setUsers(data.data || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/users/${user.id}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== user.id));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSave = async (updates) => {
    try {
      const data = await apiRequest(`/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: updates,
      });
      setUsers(users.map(u => (u.id === editingUser.id ? { ...u, ...data.data } : u)));
      setEditingUser(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleView = async (user) => {
    setDetailsLoading(true);
    try {
      const data = await apiRequest(`/admin/users/${user.id}`);
      setViewingUser(data.data);
    } catch (e) {
      alert(e.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      <h1>Users</h1>
      <p className="page-sub">All registered customers and admins.</p>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-text">Loading users...</div>
        ) : error ? (
          <div className="loading-text">{error}</div>
        ) : users.length === 0 ? (
          <div className="empty-text">No users found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Account</th>
                <th>Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="clickable-row" onClick={() => handleView(user)}>
                  <td>
                    <button className="table-link" onClick={(event) => { event.stopPropagation(); handleView(user); }}>{user.name}</button>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.account || '—'}</td>
                  <td>{user.currency || 'USD'} {Number(user.balance || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${user.status}`}>{user.status}</span>
                  </td>
                  <td>
                    <span className="action-link" onClick={(event) => { event.stopPropagation(); setEditingUser(user); }}>Edit</span>
                    <span className="action-link danger" onClick={(event) => { event.stopPropagation(); handleDelete(user); }}>Delete</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
        />
      )}

      {detailsLoading && <div className="loading-text">Loading user details...</div>}
      {viewingUser && (
        <UserDetailsModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  );
}

function UserDetailsModal({ user, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card user-details" onClick={(e) => e.stopPropagation()}>
        <h2>{user.name}</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone || '—'}</p>
        <p><strong>Role:</strong> {user.role || 'customer'}</p>
        <p><strong>Status:</strong> <span className={`badge ${user.status}`}>{user.status}</span></p>
        <p><strong>Account:</strong> {user.account || '—'}</p>
        <p><strong>Balance:</strong> {user.currency || 'USD'} {Number(user.balance || 0).toFixed(2)}</p>
        <p><strong>Created:</strong> {user.created_at ? new Date(user.created_at).toLocaleString() : '—'}</p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSave }) {
  const [status, setStatus] = useState(user.status || 'active');
  const [role, setRole] = useState(user.role || 'customer');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Edit {user.name}</h2>

        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        <div className="field">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => onSave({ status, role })}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
