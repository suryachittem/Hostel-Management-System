import React, { useEffect, useState } from 'react';
import { getAllRooms, createRoom, updateRoom, deleteRoom } from '../../utils/api';
import { toast } from 'react-toastify';

const BLANK = { roomNumber: '', floor: '', type: 'AC', sharing: 'Single', monthlyFee: '', amenities: '', description: '' };

export default function RoomsManager() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data } = await getAllRooms();
      setRooms(data.rooms);
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, []);

  const openCreate = () => { setEditRoom(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (room) => {
    setEditRoom(room);
    setForm({
      roomNumber: room.roomNumber,
      floor: room.floor,
      type: room.type,
      sharing: room.sharing,
      monthlyFee: room.monthlyFee,
      amenities: room.amenities?.join(', ') || '',
      description: room.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        floor: Number(form.floor),
        monthlyFee: Number(form.monthlyFee),
        amenities: form.amenities ? form.amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
      };
      if (editRoom) {
        await updateRoom(editRoom._id, payload);
        toast.success('Room updated!');
      } else {
        await createRoom(payload);
        toast.success('Room created!');
      }
      setShowModal(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally { setSaving(false); }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Delete Room ${room.roomNumber}? This cannot be undone.`)) return;
    try {
      await deleteRoom(room._id);
      toast.success('Room deleted');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) });

  const typeColors = { AC: 'var(--accent)', 'Non-AC': 'var(--warning)' };
  const sharingColors = { Single: 'var(--success)', Double: 'var(--accent)', Triple: 'var(--warning)' };

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Rooms</div>
          <div className="topbar-subtitle">{rooms.length} total rooms • {rooms.filter(r => r.isAvailable).length} available</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Room</button>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {rooms.map(room => (
              <div key={room._id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: room.isAvailable ? 'var(--success)' : 'var(--danger)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Room {room.roomNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Floor {room.floor}</div>
                  </div>
                  <span className={`badge ${room.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                    {room.isAvailable ? 'Available' : 'Full'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <span className="badge badge-accent" style={{ color: typeColors[room.type] }}>{room.type}</span>
                  <span className="badge badge-accent" style={{ color: sharingColors[room.sharing] }}>{room.sharing}</span>
                </div>

                {/* Occupancy Bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Occupancy</span>
                    <span>{room.students?.length}/{room.capacity}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 4 }}>
                    <div style={{
                      height: '100%',
                      width: `${(room.students?.length / room.capacity) * 100}%`,
                      background: room.isAvailable ? 'var(--success)' : 'var(--danger)',
                      borderRadius: 4,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                {/* Students in room */}
                {room.students?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>OCCUPANTS</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {room.students.map(s => (
                        <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <div className="user-avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }}>
                            {s.profilePhoto ? <img src={s.profilePhoto} alt="" /> : s.name?.[0]}
                          </div>
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>
                    ₹{room.monthlyFee?.toLocaleString('en-IN')}<span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--text-muted)' }}>/mo</span>
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(room)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(room)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editRoom ? 'Edit Room' : 'Create New Room'}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Room Number *</label>
                    <input className="form-input" placeholder="e.g. 101" {...f('roomNumber')} required disabled={!!editRoom} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Floor *</label>
                    <input type="number" className="form-input" placeholder="0" min={0} {...f('floor')} required />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-select" {...f('type')} required>
                      <option value="AC">AC</option>
                      <option value="Non-AC">Non-AC</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sharing *</label>
                    <select className="form-select" {...f('sharing')} required>
                      <option value="Single">Single (1 person)</option>
                      <option value="Double">Double (2 persons)</option>
                      <option value="Triple">Triple (3 persons)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Fee (₹) *</label>
                  <input type="number" className="form-input" placeholder="5000" min={0} {...f('monthlyFee')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amenities (comma-separated)</label>
                  <input className="form-input" placeholder="WiFi, AC, Attached Bathroom, Study Table" {...f('amenities')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" placeholder="Optional room description..." {...f('description')} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : (editRoom ? '✓ Update Room' : '✓ Create Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
