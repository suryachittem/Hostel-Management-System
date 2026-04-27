import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { getMyPayments, getPaymentById, createCheckoutSession } from '../../utils/api';
import { generateReceiptPDF } from '../../utils/generatePDF';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

// Lazy Stripe initialisation — avoids module-level HTTP warning in dev
let stripePromise = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

export default function StudentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyPayments();
        setPayments(data.payments);
      } catch { toast.error('Failed to load payments'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const paidThisMonth = payments.find(p => p.paymentMonth === currentMonth && p.status === 'completed');

  const handlePayNow = async () => {
    if (!user?.room) { toast.warning('No room assigned. Contact admin.'); return; }
    if (paidThisMonth) { toast.info('Already paid for this month!'); return; }
    setPayLoading(true);
    try {
      const { data } = await createCheckoutSession({
        amount: user.feeAmount || 0,
        paymentMonth: currentMonth,
        description: `Hostel Fee - ${currentMonthLabel}`,
      });
      // Prefer direct URL redirect — works on HTTP localhost
      if (data.sessionUrl) { window.location.href = data.sessionUrl; return; }
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (error) toast.error(error.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setPayLoading(false); }
  };

  const handleDownloadReceipt = async (paymentId) => {
    setDownloadingId(paymentId);
    try {
      const { data } = await getPaymentById(paymentId);
      generateReceiptPDF(data.payment);
      toast.success('Receipt downloaded!');
    } catch { toast.error('Failed to generate receipt'); }
    finally { setDownloadingId(null); }
  };

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">My Payments</div>
          <div className="topbar-subtitle">Payment history & receipts</div>
        </div>
        {!paidThisMonth && user?.room && (
          <button className="btn btn-primary" onClick={handlePayNow} disabled={payLoading}>
            {payLoading ? <><span className="spinner" /> Processing...</> : '💳 Pay This Month'}
          </button>
        )}
      </div>

      <div className="page-content">
        {/* Summary */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
          <div className="stat-card" style={{ '--card-accent': 'var(--success)' }}>
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💰</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{totalPaid.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Paid</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--accent)' }}>
            <div className="stat-icon">📋</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{payments.filter(p => p.status === 'completed').length}</div>
            <div className="stat-label">Payments Made</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': paidThisMonth ? 'var(--success)' : 'var(--warning)' }}>
            <div className="stat-icon" style={{ background: paidThisMonth ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }}>
              {paidThisMonth ? '✅' : '⏳'}
            </div>
            <div className="stat-value" style={{ fontSize: '1rem', marginTop: 4 }}>
              {paidThisMonth ? 'Paid' : 'Pending'}
            </div>
            <div className="stat-label">This Month</div>
          </div>
        </div>

        {/* Current Month Fee */}
        {!paidThisMonth && user?.room && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>⏳ Fee Due — {currentMonthLabel}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Your hostel fee of <strong style={{ color: 'var(--text-primary)' }}>₹{user?.feeAmount?.toLocaleString('en-IN')}</strong> is pending for this month.
                </p>
              </div>
              <button className="btn btn-primary" onClick={handlePayNow} disabled={payLoading}>
                {payLoading ? <><span className="spinner" /> Processing...</> : '💳 Pay Now — ₹' + (user?.feeAmount?.toLocaleString('en-IN') || '0')}
              </button>
            </div>
          </div>
        )}

        {/* Payment Table */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>Transaction History</div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
          ) : payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <p>No payment history yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Description</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid On</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td><code style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{p.receiptNumber}</code></td>
                      <td style={{ fontSize: '0.8rem' }}>{p.description || 'Hostel Fee'}</td>
                      <td>{p.paymentMonth}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge badge-${p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}`}>
                          {p.status === 'completed' ? '✓ Paid' : p.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        {p.status === 'completed' ? (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleDownloadReceipt(p._id)}
                            disabled={downloadingId === p._id}
                          >
                            {downloadingId === p._id
                              ? <span className="spinner" />
                              : '⬇ PDF'}
                          </button>
                        ) : '—'}
                      </td>
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
