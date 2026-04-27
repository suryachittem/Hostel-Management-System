import React, { useEffect, useState, useCallback } from 'react';
import { getAllStudents, getStudentById, assignRoom, getAllRooms, removeFromRoom, updateStudentAdmin } from '../../utils/api';
import { toast } from 'react-toastify';

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [assignRoomId, setAssignRoomId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const { data } = await getAllStudents({ page, limit: 10, search: q });
      setStudents(data.students);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchStudents(1, ''); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(1, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const openStudentModal = async (student) => {
    try {
      const [sRes, rRes] = await Promise.all([getStudentById(student._id), getAllRooms()]);
      setSelectedStudent(sRes.data);
      setRooms(rRes.data.rooms);
      setAssignRoomId(student.room?._id || '');
      setShowModal(true);
    } catch { toast.error('Failed to load details'); }
  };

  const handleAssignRoom = async () => {
    if (!assignRoomId) return;
    setActionLoading(true);
    try {
      await assignRoom({ studentId: selectedStudent.student._id, roomId: assignRoomId });
      toast.success('Room assigned successfully!');
      setShowModal(false);
      fetchStudents(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign room'); }
    finally { setActionLoading(false); }
  };

  const handleRemoveRoom = async () => {
    if (!selectedStudent?.student?.room) return;
    setActionLoading(true);
    try {
      await removeFromRoom({ studentId: selectedStudent.student._id });
      toast.success('Student removed from room');
      setShowModal(false);
      fetchStudents(pagination.page);
    } catch { toast.error('Failed to remove from room'); }
    finally { setActionLoading(false); }
  };

  const availableRooms = rooms.filter(r => !r.isFull || r._id === assignRoomId);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Students</div>
          <div className="topbar-subtitle">{pagination.total} registered students</div>
        </div>
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
            <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
          ) : students.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👩‍🎓</div><p>No students found</p></div>
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
                              {s.profilePhoto ? <img src={s.profilePhoto} alt="" /> : (s.name?.[0] || '?')}
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
                          {s.room ? (
                            <span className="badge badge-accent">
                              Room {s.room.roomNumber} • {s.room.type} • {s.room.sharing}
                            </span>
                          ) : <span className="badge badge-neutral">Not Assigned</span>}
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
                          <button className="btn btn-outline btn-sm" onClick={() => openStudentModal(s)}>
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
                      onClick={() => fetchStudents(p)}
                    >{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Student Modal */}
      {showModal && selectedStudent && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Student Details</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div className="user-avatar" style={{ width: 60, height: 60, fontSize: '1.2rem' }}>
                  {selectedStudent.student.profilePhoto
                    ? <img src={selectedStudent.student.profilePhoto} alt="" />
                    : (selectedStudent.student.name?.[0] || '?')}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.student.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedStudent.student.email}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {selectedStudent.student.phone}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🪪 Aadhaar: {selectedStudent.student.aadhaar}</div>
                </div>
              </div>

              {/* Current Room */}
              {selectedStudent.student.room && (
                <div style={{ padding: '12px 16px', background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 16 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>CURRENT ROOM</p>
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
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 6, fontSize: '0.8rem' }}>
                      <span>{p.receiptNumber} • {p.paymentMonth}</span>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <strong>₹{p.amount?.toLocaleString('en-IN')}</strong>
                        <span className={`badge badge-${p.status === 'completed' ? 'success' : 'warning'}`}>{p.status}</span>
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
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleAssignRoom} disabled={!assignRoomId || actionLoading}>
                {actionLoading ? <><span className="spinner" /> Saving...</> : '✓ Assign Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
