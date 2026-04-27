import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPayment, getPaymentById } from '../../utils/api';
import { generateReceiptPDF } from '../../utils/generatePDF';
import { toast } from 'react-toastify';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) { setError('Invalid session'); setLoading(false); return; }

    const verify = async () => {
      try {
        const { data } = await verifyPayment({ sessionId });
        setPayment(data.payment);
        toast.success('Payment verified successfully!');
      } catch (err) {
        setError(err.response?.data?.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [searchParams]);

  const handleDownload = async () => {
    if (!payment) return;
    try {
      const { data } = await getPaymentById(payment._id);
      generateReceiptPDF(data.payment);
      toast.success('Receipt downloaded!');
    } catch { toast.error('Failed to generate receipt'); }
  };

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      <p style={{ color: 'var(--text-muted)' }}>Verifying your payment...</p>
    </div>
  );

  if (error) return (
    <div className="page-loader">
      <div style={{ fontSize: '3rem' }}>❌</div>
      <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
      <button className="btn btn-primary" onClick={() => navigate('/student')}>Go to Dashboard</button>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 20,
    }}>
      <div className="card slide-up" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        {/* Success Icon */}
        <div style={{
          width: 80, height: 80,
          background: 'rgba(16,185,129,0.15)',
          border: '2px solid var(--success)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 20px',
        }}>✅</div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Payment Successful!
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
          Your hostel fee has been received. Here are your payment details.
        </p>

        {/* Receipt Summary */}
        {payment && (
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px 24px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            {[
              { label: 'Receipt Number', value: payment.receiptNumber },
              { label: 'Student', value: payment.student?.name },
              { label: 'Room', value: payment.room ? `Room ${payment.room.roomNumber} (${payment.room.type}, ${payment.room.sharing})` : '—' },
              { label: 'Payment Month', value: payment.paymentMonth },
              { label: 'Amount Paid', value: `₹${payment.amount?.toLocaleString('en-IN')}`, highlight: true },
              { label: 'Status', value: '✓ Completed', success: true },
              { label: 'Date', value: payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{
                  fontWeight: item.highlight ? 700 : 500,
                  color: item.success ? 'var(--success)' : item.highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleDownload}
          >
            ⬇ Download PDF Receipt
          </button>
          <button
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => navigate('/student/payments')}
          >
            View All Payments
          </button>
        </div>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={() => navigate('/student')}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
