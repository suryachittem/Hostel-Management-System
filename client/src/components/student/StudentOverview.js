import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../context/AuthContext';
import { getMyPayments, createCheckoutSession, getMe } from '../../utils/api';
import { toast } from 'react-toastify';

// Lazy-initialise Stripe only when needed (avoids module-level HTTP warning)
let stripePromise = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

export default function StudentOverview() {
  const { user, refreshUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const load = async () => {
      try {
        await refreshUser();
        const { data } = await getMyPayments();
        setPayments(data.payments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const paidThisMonth = payments.find(
    (p) => p.paymentMonth === currentMonth && p.status === 'completed'
  );

  const handlePayNow = async () => {
    if (!user?.room) {
      toast.warning('No room assigned yet. Please contact admin.');
      return;
    }
    if (paidThisMonth) {
      toast.info('Fee already paid for this month!');
      return;
    }
    setPayLoading(true);
    try {
      const { data } = await createCheckoutSession({
        amount: user.feeAmount || user.room?.monthlyFee || 0,
        paymentMonth: currentMonth,
        description: `Hostel Fee - ${currentMonthLabel}`,
      });
      // Prefer direct URL redirect (works on HTTP localhost too)
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
        return;
      }
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (error) toast.error(error.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed to initiate');
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  const room = user?.room;

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">My Room & Fees</div>
          <div className="topbar-subtitle">Welcome back, {user?.name}!</div>
        </div>
      </div>

      <div className="page-content">
        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.1))',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 'var(--radius)',
          padding: '24px 28px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div className="user-avatar" style={{ width: 60, height: 60, fontSize: '1.4rem', flexShrink: 0 }}>
            {user?.profilePhoto ? <img src={user.profilePhoto} alt="" /> : (user?.name?.[0] || '?')}
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {user?.name}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email} • {user?.phone}</p>
            {user?.aadhaar && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aadhaar: XXXX XXXX {user.aadhaar.slice(-4)}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Room Details */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">🛏️ Room Details</div>
                <div className="card-subtitle">Your accommodation info</div>
              </div>
            </div>

            {room ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Room Number', value: room.roomNumber, icon: '🔢' },
                    { label: 'Floor', value: `Floor ${room.floor}`, icon: '🏢' },
                    { label: 'Type', value: room.type, icon: room.type === 'AC' ? '❄️' : '🌀' },
                    { label: 'Sharing', value: room.sharing, icon: '👥' },
                  ].map((item) => (
                    <div key={item.label} style={{
                      padding: '12px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {item.icon} {item.label}
                      </p>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {room.amenities?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Amenities
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {room.amenities.map((a) => (
                        <span key={a} className="badge badge-neutral">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🛏️</div>
                <p>No room assigned yet.<br />Please contact the admin.</p>
              </div>
            )}
          </div>

          {/* Fee Details */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">💳 Fee Details</div>
                <div className="card-subtitle">{currentMonthLabel}</div>
              </div>
              {paidThisMonth
                ? <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>✓ Paid</span>
                : <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>⏳ Due</span>}
            </div>

            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>MONTHLY FEE</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                ₹{(user?.feeAmount || room?.monthlyFee || 0).toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 24 }}>per month</p>

              {paidThisMonth ? (
                <div className="alert alert-success" style={{ textAlign: 'left' }}>
                  ✅ Fee paid on {new Date(paidThisMonth.paidAt).toLocaleDateString('en-IN')}
                  <br />
                  <span style={{ fontSize: '0.75rem' }}>Receipt: {paidThisMonth.receiptNumber}</span>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handlePayNow}
                  disabled={payLoading || !room}
                >
                  {payLoading
                    ? <><span className="spinner" /> Processing...</>
                    : '💳 Pay Now via Stripe'}
                </button>
              )}
            </div>

            {user?.feeDueDate && (
              <p style={{ fontSize: '0.75rem', color: 'var(--warning)', textAlign: 'center' }}>
                ⚠️ Due by: {new Date(user.feeDueDate).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Payments</div>
          </div>

          {payments.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💳</div><p>No payments yet</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 6).map((p) => (
                    <tr key={p._id}>
                      <td><code style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{p.receiptNumber}</code></td>
                      <td>{p.paymentMonth}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
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
