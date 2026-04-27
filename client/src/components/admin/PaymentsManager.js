import React, { useEffect, useState, useCallback } from 'react';
import { getAdminPayments } from '../../utils/api';
import { toast } from 'react-toastify';

export default function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', month: '' });
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getAdminPayments({ page, limit: 15, ...filters });
      setPayments(data.payments);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchPayments(1); }, [fetchPayments]);

  const totalAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Payments</div>
          <div className="topbar-subtitle">{pagination.total} total transactions</div>
        </div>
      </div>

      <div className="page-content">
        {/* Summary */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
          <div className="stat-card" style={{ '--card-accent': 'var(--success)' }}>
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💰</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Shown Revenue</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--accent)' }}>
            <div className="stat-icon">✔️</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{payments.filter(p => p.status === 'completed').length}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--warning)' }}>
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⏳</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{payments.filter(p => p.status === 'pending').length}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="card-title">Transaction History</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                className="form-select"
                style={{ width: 140 }}
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <input
                type="month"
                className="form-input"
                style={{ width: 160 }}
                value={filters.month}
                onChange={e => setFilters({ ...filters, month: e.target.value })}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
          ) : payments.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💳</div><p>No payments found</p></div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Paid On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id}>
                        <td><code style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{p.receiptNumber}</code></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                              {p.student?.profilePhoto
                                ? <img src={p.student.profilePhoto} alt="" />
                                : (p.student?.name?.[0] || '?')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{p.student?.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.student?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{p.room ? `Room ${p.room.roomNumber}` : '—'}</td>
                        <td>{p.paymentMonth}</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`badge badge-${p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => fetchPayments(p)}
                    >{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
