import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllStudents,
  getStudentById,
  assignRoom,
  getAllRooms,
  removeFromRoom,
} from '../../utils/api';
import API from '../../utils/api';
import { toast } from 'react-toastify';

const BLANK = { name: '', email: '', password: '', phone: '', aadhaar: '' };

export default function StudentsManager() {
  const [students,        setStudents]        = useState([]);
  const [pagination,      setPagination]      = useState({ page: 1, pages: 1, total: 0 });
  const [search,          setSearch]          = useState('');
  const [loading,         setLoading]         = useState(true);

  // Manage modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rooms,           setRooms]           = useState([]);
  const [showManageModal, setShowManageModal] = useState(false);
  const [assignRoomId,    setAssignRoomId]    = useState('');
  const [actionLoading,   setActionLoading]   = useState(false);

  // Add student modal
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [addForm,         setAddForm]         = useState(BLANK);
  const [addPhoto,        setAddPhoto]        = useState(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState('');
  const [addErrors,       setAddErrors]       = useState({});
  const [addLoading,      setAddLoading]      = useState(false);

  // ── fetch ───────────────────────────────────────────────────
  const fetchStudents = useCallback(async (page = 1, q = '') => {
    setLoading(true);
    try {
      const { data } = await getAllStudents({ page, limit: 10, search: q });
      setStudents(data.students);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStudents(1, ''); }, [fetchStudents]);

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(1, search), 400);
    return () => clearTimeout(t);
  }, [search, fetchStudents]);

  // ── manage modal ────────────────────────────────────────────
  const openManageModal = async (student) => {
    try {
      const [sRes, rRes] = await Promise.all([getStudentById(student._id), getAllRooms()]);
      setSelectedStudent(sRes.data);
      setRooms(rRes.data.rooms);
      setAssignRoomId(student.room?._id || '');
      setShowManageModal(true);
    } catch { toast.error('Failed to load details'); }
  };

  const handleAssignRoom = async () => {
    if (!assignRoomId) return;
    setActionLoading(true);
    try {
      await assignRoom({ studentId: selectedStudent.student._id, roomId: assignRoomId });
      toast.success('Room assigned successfully!');
      setShowManageModal(false);
      fetchStudents(pagination.page, search);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign room'); }
    finally { setActionLoading(false); }
  };

  const handleRemoveRoom = async () => {
    if (!selectedStudent?.student?.room) return;
    setActionLoading(true);
    try {
      await removeFromRoom({ studentId: selectedStudent.student._id });
      toast.success('Student removed from room');
      setShowManageModal(false);
      fetchStudents(pagination.page, search);
    } catch { toast.error('Failed to remove from room'); }
    finally { setActionLoading(false); }
  };

  // ── add student ─────────────────────────────────────────────
  const validateAdd = () => {
    const e = {};
    if (!addForm.name.trim())                    e.name     = 'Name is required';
    if (!addForm.email.match(/^\S+@\S+\.\S+$/)) e.email    = 'Valid email required';
    if (addForm.password.length < 6)             e.password = 'Min 6 characters';
    if (!addForm.phone.match(/^[0-9]{10}$/))     e.phone    = '10-digit phone required';
    if (!addForm.aadhaar.match(/^[0-9]{12}$/))   e.aadhaar  = '12-digit Aadhaar required';
    setAddErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    setAddPhoto(file);
    setAddPhotoPreview(URL.createObjectURL(file));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!validateAdd()) return;
    setAddLoading(true);
    try {
      const formData = new FormData();
      Object.entries(addForm).forEach(([k, v]) => formData.append(k, v));
      if (addPhoto) formData.append('profilePhoto', addPhoto);
      await API.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Student "${addForm.name}" added successfully!`);
      setShowAddModal(false);
      setAddForm(BLANK);
      setAddPhoto(null);
      setAddPhotoPreview('');
      setAddErrors({});
      fetchStudents(1, '');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally { setAddLoading(false); }
  };

  const openAddModal = () => {
    setAddForm(BLANK);
    setAddErrors({});
    setAddPhoto(null);
    setAddPhotoPreview('');
    setShowAddModal(true);
  };

  const availableRooms = rooms.filter(r => !r.isFull || r._id === assignRoomId);
  const af = (field) => ({
    value: addForm[field],
    onChange: (e) => {
      setAddForm({ ...addForm, [field]: e.target.value });
      setAddErrors({ ...addErrors, [field]: '' });
    },
  });

  // ── render ──────────────────────────────────────────────────
  return (
    <div>
      {/* Top Bar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Students</div>
          <div className="topbar-subtitle">{pagination.total} registered students</div>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Student
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Students</div>
            <input
              className="form-input"
              style={{ width: 260 }}
              placeholder="🔍 Search by name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👩‍🎓</div>
              <p>No students found</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAddModal}>
                + Add First Student
              </button>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Contact</th>
                      <th>Room</th>
                      <th>Fee / Month</th>
                      <th>Fee Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="user-avatar" style={{ width: 36, height: 36 }}>
                              {s.profilePhoto
                                ? <img src={s.profilePhoto} alt="" />
                                : (s.name?.[0] || '?')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{s.phone || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Aadhaar: {s.aadhaar ? `XXXX ${s.aadhaar.slice(-4)}` : '—'}
                          </div>
                        </td>
                        <td>
                          {s.room
                            ? <span className="badge badge-accent">Room {s.room.roomNumber} • {s.room.type} • {s.room.sharing}</span>
                            : <span className="badge badge-neutral">Not Assigned</span>}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {s.feeAmount ? `₹${s.feeAmount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td>
                          <span className={`badge badge-${s.feeStatus === 'paid' ? 'success' : 'warning'}`}>
                            {s.feeStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => openManageModal(s)}>
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => fetchStudents(p, search)}
                    >{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ADD STUDENT MODAL
      ══════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">➕ Add New Student</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div className="modal-body">

                {/* Photo Upload */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                    <div style={{
                      width: 84, height: 84,
                      borderRadius: '50%',
                      background: addPhotoPreview ? 'transparent' : 'var(--accent-glow)',
                      border: '3px dashed var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px',
                      overflow: 'hidden',
                      fontSize: '2rem',
                      transition: 'all 0.2s',
                    }}>
                      {addPhotoPreview
                        ? <img src={addPhotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '📷'}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {addPhotoPreview ? 'Click to change photo' : 'Upload Profile Photo (optional)'}
                    </p>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                  </label>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="Arjun Sharma" {...af('name')} required />
                    {addErrors.name && <p className="form-error">{addErrors.name}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-input" placeholder="student@email.com" {...af('email')} required />
                    {addErrors.email && <p className="form-error">{addErrors.email}</p>}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input className="form-input" placeholder="9876543210" maxLength={10} {...af('phone')} required />
                    {addErrors.phone && <p className="form-error">{addErrors.phone}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aadhaar Number *</label>
                    <input className="form-input" placeholder="123456789012" maxLength={12} {...af('aadhaar')} required />
                    {addErrors.aadhaar && <p className="form-error">{addErrors.aadhaar}</p>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" placeholder="Min. 6 characters" {...af('password')} required />
                  {addErrors.password && <p className="form-error">{addErrors.password}</p>}
                </div>

                <div className="alert alert-warning" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
                  💡 Share these login credentials with the student after adding them.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? <><span className="spinner" /> Adding...</> : '✓ Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MANAGE STUDENT MODAL
      ══════════════════════════════════════════════════════ */}
      {showManageModal && selectedStudent && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowManageModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Manage Student</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowManageModal(false)}>✕</button>
            </div>
            <div className="modal-body">

              {/* Profile */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
                padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
              }}>
                <div className="user-avatar" style={{ width: 60, height: 60, fontSize: '1.2rem' }}>
                  {selectedStudent.student.profilePhoto
                    ? <img src={selectedStudent.student.profilePhoto} alt="" />
                    : (selectedStudent.student.name?.[0] || '?')}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedStudent.student.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedStudent.student.email}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {selectedStudent.student.phone || '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    🪪 {selectedStudent.student.aadhaar ? `XXXX XXXX ${selectedStudent.student.aadhaar.slice(-4)}` : '—'}
                  </div>
                </div>
              </div>

              {/* Current Room */}
              {selectedStudent.student.room && (
                <div style={{
                  padding: '12px 16px', marginBottom: 16,
                  background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>CURRENT ROOM</p>
                  <p style={{ fontWeight: 600, color: 'var(--accent)' }}>
                    Room {selectedStudent.student.room.roomNumber} • {selectedStudent.student.room.type} • {selectedStudent.student.room.sharing}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Fee: ₹{selectedStudent.student.room.monthlyFee?.toLocaleString('en-IN')}/month
                  </p>
                </div>
              )}

              {/* Assign Room */}
              <div className="form-group">
                <label className="form-label">Assign / Change Room</label>
                <select className="form-select" value={assignRoomId} onChange={e => setAssignRoomId(e.target.value)}>
                  <option value="">— Select a room —</option>
                  {availableRooms.map(r => (
                    <option key={r._id} value={r._id}>
                      Room {r.roomNumber} • {r.type} • {r.sharing} • ₹{r.monthlyFee}/mo • ({r.students?.length}/{r.capacity} occupied)
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment History */}
              {selectedStudent.payments?.length > 0 && (
                <div>
                  <p className="form-label" style={{ marginBottom: 8 }}>Recent Payments</p>
                  {selectedStudent.payments.slice(0, 4).map(p => (
                    <div key={p._id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 12px', background: 'var(--bg-secondary)',
                      borderRadius: 6, marginBottom: 6, fontSize: '0.8rem',
                    }}>
                      <span>{p.receiptNumber} • {p.paymentMonth}</span>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <strong>₹{p.amount?.toLocaleString('en-IN')}</strong>
                        <span className={`badge badge-${p.status === 'completed' ? 'success' : 'warning'}`}>
                          {p.status}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedStudent.student.room && (
                <button className="btn btn-danger btn-sm" onClick={handleRemoveRoom} disabled={actionLoading}>
                  Remove from Room
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setShowManageModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAssignRoom}
                disabled={!assignRoomId || actionLoading}
              >
                {actionLoading ? <><span className="spinner" /> Saving...</> : '✓ Assign Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
