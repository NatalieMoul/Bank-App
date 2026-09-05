import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      params.set('page', page);

      const data = await apiRequest(`/admin/logs?${params.toString()}`);
      setLogs(data.data || []);
      setPagination(data.pagination);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action]);

  return (
    <div>
      <h1>System Logs</h1>
      <p className="page-sub">Audit trail of account and system activity.</p>

      <div className="filters">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          <option value="USER_CREATED">User Created</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="PASSWORD_CHANGED">Password Changed</option>
          <option value="USER_UPDATED">User Updated</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-text">Loading logs...</div>
        ) : error ? (
          <div className="loading-text">{error}</div>
        ) : logs.length === 0 ? (
          <div className="empty-text">No logs found.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.action}</td>
                    <td>{log.user?.name || '—'}</td>
                    <td><span className={`badge ${log.status}`}>{log.status}</span></td>
                    <td>{log.description}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && (
              <div className="pagination">
                <span style={{ fontSize: 13, color: '#9B98C4', marginRight: 'auto' }}>
                  Page {pagination.current_page} of {pagination.last_page} — {pagination.total} total
                </span>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <button disabled={page >= pagination.last_page} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
