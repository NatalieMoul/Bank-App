import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function ReportsPage() {
  const [txnSummary, setTxnSummary] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [spendingReport, setSpendingReport] = useState([]);
  const [spendingSort, setSpendingSort] = useState('highest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [txns, users, balance, spending] = await Promise.all([
          apiRequest('/admin/reports/transactions'),
          apiRequest('/admin/reports/users'),
          apiRequest('/admin/reports/balance'),
          apiRequest('/admin/reports/spending'),
        ]);
        setTxnSummary(txns);
        setUserSummary(users);
        setBalanceSummary(balance);
        setSpendingReport(spending.data || []);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="loading-text">Loading reports...</div>;
  if (error) return <div className="loading-text">{error}</div>;

  return (
    <div>
      <h1>Reports</h1>
      <p className="page-sub">System-wide summary statistics.</p>

      <h2 style={{ fontSize: 15, marginBottom: 10 }}>Users</h2>
      <div className="stat-grid">
        <StatCard label="Total Users" value={userSummary.total_users} />
        <StatCard label="Active Users" value={userSummary.active_users} />
        <StatCard label="Customers" value={userSummary.customers} />
        <StatCard label="Admins" value={userSummary.admins} />
      </div>

      <h2 style={{ fontSize: 15, marginBottom: 10 }}>Balances</h2>
      <div className="stat-grid">
        <StatCard label="Total Balance (all accounts)" value={`$${Number(balanceSummary.total_balance).toFixed(2)}`} />
        <StatCard label="Total Accounts" value={balanceSummary.accounts} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 15, margin: 0 }}>Highest Spending</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span>Sort by</span>
          <select value={spendingSort} onChange={(e) => setSpendingSort(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
            <option value="highest">Highest to Lowest</option>
            <option value="lowest">Lowest to Highest</option>
          </select>
        </label>
      </div>
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        {spendingReport.length === 0 ? (
          <div className="empty-text">No spending data found.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Rank</th><th>User</th><th>Email</th><th>Transactions</th><th>Total Spending</th></tr>
            </thead>
            <tbody>
              {[...spendingReport].sort((a, b) => {
                const amountA = Number(a.total_spending) || 0;
                const amountB = Number(b.total_spending) || 0;
                return spendingSort === 'highest' ? amountB - amountA : amountA - amountB;
              }).map((user, index) => (
                <tr key={user.user_id}>
                  <td>#{index + 1}</td><td>{user.name || '—'}</td><td>{user.email || '—'}</td><td>{user.transaction_count}</td><td>${Number(user.total_spending).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 style={{ fontSize: 15, marginBottom: 10 }}>Transactions</h2>
      <div className="stat-grid">
        <StatCard label="Total Transactions" value={txnSummary.total_transactions} />
        <StatCard label="Total Amount" value={`$${Number(txnSummary.total_amount).toFixed(2)}`} />
        <StatCard label="Completed" value={txnSummary.completed} />
        <StatCard label="Pending" value={txnSummary.pending} />
        <StatCard label="Failed" value={txnSummary.failed} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}