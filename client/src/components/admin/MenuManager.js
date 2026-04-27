import React, { useEffect, useState } from 'react';
import { getCurrentMenu, createMenu, updateMenu } from '../../utils/api';
import { toast } from 'react-toastify';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];
const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snacks: '🫖 Snacks', dinner: '🌙 Dinner' };
const MEAL_TIMES = {
  breakfast: '7:30 AM - 9:00 AM',
  lunch: '12:30 PM - 2:00 PM',
  snacks: '5:00 PM - 6:00 PM',
  dinner: '8:00 PM - 9:30 PM',
};

const blankDay = (day) => ({
  day,
  breakfast: { name: 'Breakfast', time: MEAL_TIMES.breakfast, items: [] },
  lunch: { name: 'Lunch', time: MEAL_TIMES.lunch, items: [] },
  snacks: { name: 'Evening Snacks', time: MEAL_TIMES.snacks, items: [] },
  dinner: { name: 'Dinner', time: MEAL_TIMES.dinner, items: [] },
});

const blankMenu = () => ({
  title: 'Weekly PG Menu',
  weekStartDate: new Date().toISOString().split('T')[0],
  specialNote: '',
  menu: DAYS.map(blankDay),
});

export default function MenuManager() {
  const [currentMenu, setCurrentMenu] = useState(null);
  const [form, setForm] = useState(blankMenu());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCurrentMenu();
        if (data.menu) {
          setCurrentMenu(data.menu);
          // Populate form with existing menu
          const filled = blankMenu();
          filled.title = data.menu.title || 'Weekly PG Menu';
          filled.weekStartDate = data.menu.weekStartDate
            ? new Date(data.menu.weekStartDate).toISOString().split('T')[0]
            : filled.weekStartDate;
          filled.specialNote = data.menu.specialNote || '';
          if (data.menu.menu?.length) {
            filled.menu = DAYS.map((day) => {
              const existing = data.menu.menu.find((d) => d.day === day);
              return existing || blankDay(day);
            });
          }
          setForm(filled);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateDayMeal = (dayIdx, meal, field, value) => {
    const updated = [...form.menu];
    updated[dayIdx] = {
      ...updated[dayIdx],
      [meal]: { ...updated[dayIdx][meal], [field]: value },
    };
    setForm({ ...form, menu: updated });
  };

  const handleItemsChange = (dayIdx, meal, value) => {
    const items = value.split('\n').map((i) => i.trim()).filter(Boolean);
    updateDayMeal(dayIdx, meal, 'items', items);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        weekStartDate: form.weekStartDate,
        specialNote: form.specialNote,
        menu: form.menu,
      };
      if (currentMenu?._id) {
        await updateMenu(currentMenu._id, { ...payload, isActive: true });
        toast.success('Menu updated successfully!');
      } else {
        await createMenu(payload);
        toast.success('Menu created successfully!');
      }
      const { data } = await getCurrentMenu();
      setCurrentMenu(data.menu);
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Food Menu</div>
          <div className="topbar-subtitle">Manage weekly PG meal schedule</div>
        </div>
        <button
          className={`btn ${editMode ? 'btn-outline' : 'btn-primary'}`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? '✕ Cancel' : '✏️ Edit Menu'}
        </button>
      </div>

      <div className="page-content">
        {editMode ? (
          /* ── Edit Mode ── */
          <div className="card">
            <div className="card-header">
              <div className="card-title">Edit Weekly Menu</div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : '✓ Save Menu'}
              </button>
            </div>

            {/* Meta */}
            <div className="form-grid" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label">Menu Title</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Week Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.weekStartDate}
                  onChange={(e) => setForm({ ...form, weekStartDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Special Note (optional)</label>
              <input
                className="form-input"
                placeholder="e.g. Sunday special: Biryani for lunch!"
                value={form.specialNote}
                onChange={(e) => setForm({ ...form, specialNote: e.target.value })}
              />
            </div>

            {/* Day Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  className={`btn btn-sm ${activeDay === i ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveDay(i)}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Meal Editors */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {MEALS.map((meal) => (
                <div key={meal} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: '0.875rem' }}>
                    {MEAL_LABELS[meal]}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    {form.menu[activeDay]?.[meal]?.time || MEAL_TIMES[meal]}
                  </p>
                  <label className="form-label">Items (one per line)</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    style={{ fontSize: '0.8rem' }}
                    placeholder={`e.g.\nIdli\nSambar\nChutney\nTea`}
                    value={(form.menu[activeDay]?.[meal]?.items || []).join('\n')}
                    onChange={(e) => handleItemsChange(activeDay, meal, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── View Mode ── */
          <div>
            {currentMenu ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{currentMenu.title}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Week of {new Date(currentMenu.weekStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {currentMenu.updatedBy && ` · Updated by ${currentMenu.updatedBy.name}`}
                    </p>
                  </div>
                  {currentMenu.specialNote && (
                    <div className="alert alert-warning" style={{ margin: 0, maxWidth: 300 }}>
                      📢 {currentMenu.specialNote}
                    </div>
                  )}
                </div>

                <div className="menu-grid">
                  {currentMenu.menu?.map((dayMenu) => (
                    <div key={dayMenu.day} className="menu-day-card">
                      <div className="menu-day-header">
                        <div className="menu-day-name">{dayMenu.day}</div>
                      </div>
                      {MEALS.map((meal) => (
                        <div key={meal} className="meal-section">
                          <div className="meal-label">{MEAL_LABELS[meal]}</div>
                          {dayMenu[meal]?.time && (
                            <div className="meal-time">⏰ {dayMenu[meal].time}</div>
                          )}
                          <div className="meal-items">
                            {dayMenu[meal]?.items?.length
                              ? dayMenu[meal].items.join(' · ')
                              : <em style={{ color: 'var(--text-muted)' }}>Not set</em>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">🍽️</div>
                  <p>No menu published yet.</p>
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setEditMode(true)}>
                    + Create First Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
