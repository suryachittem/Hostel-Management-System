import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerStudent } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', aadhaar: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.phone.match(/^[0-9]{10}$/)) e.phone = '10-digit phone number required';
    if (!form.aadhaar.match(/^[0-9]{12}$/)) e.aadhaar = '12-digit Aadhaar number required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (photo) formData.append('profilePhoto', photo);

      const { data } = await registerStudent(formData);
      loginUser(data.token, data.user);
      toast.success('Registration successful! Welcome!');
      navigate('/student', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm({ ...form, [field]: e.target.value }); setErrors({ ...errors, [field]: '' }); },
  });

  return (
    <div className="auth-page">
      <div className="auth-card slide-up" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="logo-icon">🏠</div>
          <h2>Student Registration</h2>
          <p>Create your hostel account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Photo Upload */}
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="upload-area" style={{ cursor: 'pointer', display: 'block' }}>
              {photoPreview ? (
                <div className="upload-preview">
                  <img src={photoPreview} alt="Preview" />
                </div>
              ) : (
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
              )}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {photoPreview ? 'Click to change photo' : 'Upload Profile Photo (optional)'}
              </p>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            </label>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" placeholder="Arjun Sharma" {...f('name')} required />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-input" placeholder="you@email.com" {...f('email')} required />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input type="tel" className="form-input" placeholder="9876543210" maxLength={10} {...f('phone')} required />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Aadhaar Number *</label>
              <input type="text" className="form-input" placeholder="123456789012" maxLength={12} {...f('aadhaar')} required />
              {errors.aadhaar && <p className="form-error">{errors.aadhaar}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input type="password" className="form-input" placeholder="Min. 6 characters" {...f('password')} required />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <><span className="spinner" /> Registering...</> : '✓ Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
