import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateStudentProfile, updatePassword } from '../../utils/api';
import { toast } from 'react-toastify';

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || '');
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      if (photo) formData.append('profilePhoto', photo);
      await updateStudentProfile(formData);
      await refreshUser();
      toast.success('Profile updated!');
      setPhoto(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    try {
      await updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally { setPwSaving(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">My Profile</div>
          <div className="topbar-subtitle">Manage your account details</div>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 760 }}>
        {/* Profile Card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 20 }}>Profile Information</div>

          <form onSubmit={handleSaveProfile}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <div className="user-avatar" style={{ width: 80, height: 80, fontSize: '1.6rem' }}>
                  {photoPreview ? <img src={photoPreview} alt="" /> : initials}
                </div>
                <label style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  border: '2px solid var(--bg-primary)',
                }}>
                  📷
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                </label>
              </div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{user?.name}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</p>
                <span className="badge badge-accent" style={{ marginTop: 4 }}>Student</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Read-only fields */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Email Address (read-only)</label>
                <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Aadhaar Number (read-only)</label>
                <input
                  className="form-input"
                  value={user?.aadhaar ? `XXXX XXXX ${user.aadhaar.slice(-4)}` : '—'}
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving...</> : '✓ Save Changes'}
            </button>
          </form>
        </div>

        {/* Room Info (read-only) */}
        {user?.room && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Room Information</div>
            <div className="form-grid">
              {[
                { label: 'Room Number', value: user.room.roomNumber },
                { label: 'Type', value: user.room.type },
                { label: 'Sharing', value: user.room.sharing },
                { label: 'Monthly Fee', value: `₹${user.room.monthlyFee?.toLocaleString('en-IN')}` },
              ].map(item => (
                <div key={item.label} className="form-group">
                  <label className="form-label">{item.label}</label>
                  <input className="form-input" value={item.value} disabled style={{ opacity: 0.6 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>Change Password</div>
          <form onSubmit={handleChangePassword}>
            {pwError && <div className="alert alert-error">{pwError}</div>}
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-outline" disabled={pwSaving}>
              {pwSaving ? <><span className="spinner" /> Updating...</> : '🔒 Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
