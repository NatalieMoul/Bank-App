import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (type) params.set('type', type);
      if (month) {
        params.set('month', month);
        params.set('year', new Date().getFullYear());
      }
      params.set('page', page);

      const data = await apiRequest(`/admin/transactions?${params.toString()}`);
      setTransactions(data.data || []);
      setPagination(data.pagination);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, type, month]);

  const handleView = async (transaction) => {
    setDetailsLoading(true);
    try {
      const data = await apiRequest(`/admin/transactions/${transaction.id}`);
      setViewingTransaction(data.data);
    } catch (e) {
      alert(e.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      <h1>Transactions</h1>
      <p className="page-sub">Every deposit, withdrawal, and transfer across all accounts.</p>

      <div className="filters">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="transfer">Transfer</option>
          <option value="payment">Payment</option>
          <option value="card_expense">Card expense</option>
        </select>
        <select
          value={month}
          onChange={(e) => { setMonth(e.target.value); setPage(1); }}
          aria-label="Sort transactions by month"
        >
          <option value="">All months</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-text">Loading transactions...</div>
        ) : error ? (
          <div className="loading-text">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="empty-text">No transactions found.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="clickable-row" onClick={() => handleView(t)}>
                    <td><button className="table-link" onClick={(event) => { event.stopPropagation(); handleView(t); }}>{t.reference}</button></td>
                    <td>{t.account?.account_number || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.type}</td>
                    <td>{t.account?.currency || 'USD'} {Number(t.amount).toFixed(2)}</td>
                    <td>{t.account?.currency || 'USD'}</td>
                    <td>{t.description || '—'}</td>
                    <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
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
      {detailsLoading && <div className="loading-text">Loading transaction details...</div>}
      {viewingTransaction && (
        <TransactionDetailsModal
          transaction={viewingTransaction}
          onClose={() => setViewingTransaction(null)}
        />
      )}
    </div>
  );
}

function TransactionDetailsModal({ transaction, onClose }) {
  const currency = transaction.account?.currency || transaction.currency || 'USD';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card transaction-details" onClick={(e) => e.stopPropagation()}>
        <h2>Transaction details</h2>
        <p><strong>Reference:</strong> {transaction.reference || '—'}</p>
        <p><strong>Type:</strong> {transaction.type || '—'}</p>
        <p><strong>Amount:</strong> {currency} {Number(transaction.amount || 0).toFixed(2)}</p>
        <p><strong>Balance after:</strong> {currency} {Number(transaction.balance_after || 0).toFixed(2)}</p>
        <p><strong>Account:</strong> {transaction.account?.account_number || '—'}</p>
        <p><strong>Recipient:</strong> {transaction.recipient_account?.account_number || '—'}</p>
        <p><strong>Status:</strong> <span className={`badge ${transaction.status}`}>{transaction.status}</span></p>
        <p><strong>Description:</strong> {transaction.description || '—'}</p>
        <p><strong>Date:</strong> {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : '—'}</p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
