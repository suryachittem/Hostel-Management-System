import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Don't send role — let backend authenticate by credentials,
      // then redirect based on the role returned from server.
      const { data } = await login({ email: form.email, password: form.password });
      loginUser(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      // Navigate based on actual role from server response
      navigate(data.user.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (r) => {
    if (r === 'admin') setForm({ email: 'admin@hostel.com', password: 'admin123' });
    else setForm({ email: 'arjun@student.com', password: 'student123' });
    setRole(r);
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="logo-icon">🏠</div>
          <h2>Hostel Management</h2>
          <p>Sign in to your account</p>
        </div>

        {/* Role Toggle */}
        <div className="auth-tabs">
          <button className={`auth-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
            👩‍🎓 Student
          </button>
          <button className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
            👨‍💼 Admin
          </button>
        </div>

        {/* Demo Credentials */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: '0.72rem' }} onClick={() => fillDemo('admin')}>
            Fill Admin Demo
          </button>
          <button className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: '0.72rem' }} onClick={() => fillDemo('student')}>
            Fill Student Demo
          </button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><span className="spinner" />Signing in...</> : `Sign In as ${role === 'admin' ? 'Admin' : 'Student'}`}
          </button>
        </form>

        {role === 'student' && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            New student?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
