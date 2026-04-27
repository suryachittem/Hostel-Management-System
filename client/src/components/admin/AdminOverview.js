import React, { useEffect, useState } from 'react';
import { getAdminStats, getAdminPayments } from '../../utils/api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, paymentsRes] = await Promise.all([
          getAdminStats(),
          getAdminPayments({ limit: 5 }),
        ]);
        setStats(statsRes.data.stats);
        setRecentPayments(paymentsRes.data.payments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: '👩‍🎓', color: '#6366f1', iconBg: 'rgba(99,102,241,0.15)' },
    { label: 'Total Rooms', value: stats?.totalRooms ?? 0, icon: '🛏️', color: '#10b981', iconBg: 'rgba(16,185,129,0.15)' },
    { label: 'Available Rooms', value: stats?.availableRooms ?? 0, icon: '✅', color: '#10b981', iconBg: 'rgba(16,185,129,0.15)' },
    { label: 'Occupied Rooms', value: stats?.occupiedRooms ?? 0, icon: '🔒', color: '#f59e0b', iconBg: 'rgba(245,158,11,0.15)' },
    { label: 'Monthly Revenue', value: `₹${(stats?.monthlyRevenue ?? 0).toLocaleString('en-IN')}`, icon: '💰', color: '#10b981', iconBg: 'rgba(16,185,129,0.15)' },
    { label: 'Paid This Month', value: stats?.paidThisMonth ?? 0, icon: '✔️', color: '#6366f1', iconBg: 'rgba(99,102,241,0.15)' },
    { label: 'Pending Fees', value: stats?.pendingPayments ?? 0, icon: '⏳', color: '#ef4444', iconBg: 'rgba(239,68,68,0.15)' },
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: '🏦', color: '#a78bfa', iconBg: 'rgba(167,139,250,0.15)' },
  ];

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Dashboard Overview</div>
          <div className="topbar-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="page-content">
        <div className="stat-grid">
          {statCards.map((s, i) => (
            <div className="stat-card fade-in" key={i} style={{ '--card-accent': s.color, '--card-icon-bg': s.iconBg }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Payments</div>
              <div className="card-subtitle">Latest transactions across all students</div>
            </div>
          </div>

          {recentPayments.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💳</div><p>No payments yet</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Student</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(p => (
                    <tr key={p._id}>
                      <td><code style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{p.receiptNumber}</code></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                            {p.student?.profilePhoto
                              ? <img src={p.student.profilePhoto} alt="" />
                              : (p.student?.name?.[0] || '?')}
                          </div>
                          <span>{p.student?.name}</span>
                        </div>
                      </td>
                      <td>{p.paymentMonth}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge badge-${p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
