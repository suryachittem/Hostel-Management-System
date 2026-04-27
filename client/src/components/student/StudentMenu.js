import React, { useEffect, useState } from 'react';
import { getCurrentMenu } from '../../utils/api';

const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snacks: '🫖 Evening Snacks', dinner: '🌙 Dinner' };
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentMenu() {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // 0=Sun → 6, 1=Mon → 0
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCurrentMenu();
        setMenu(data.menu);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  const todayDayName = DAYS[activeDay];
  const dayMenu = menu?.menu?.find(d => d.day === todayDayName);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Food Menu</div>
          <div className="topbar-subtitle">
            {menu ? `Week of ${new Date(menu.weekStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}` : 'No menu published'}
          </div>
        </div>
      </div>

      <div className="page-content">
        {!menu ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <p>No menu has been published yet.<br />Check back later!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Special Note */}
            {menu.specialNote && (
              <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                📢 <strong>Special Note:</strong> {menu.specialNote}
              </div>
            )}

            {/* Day Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
              {DAYS.map((day, i) => {
                const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                return (
                  <button
                    key={day}
                    className={`btn btn-sm ${activeDay === i ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveDay(i)}
                    style={{ position: 'relative' }}
                  >
                    {day.slice(0, 3)}
                    {isToday && (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 8, height: 8,
                        background: 'var(--success)',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-primary)',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Day Title */}
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
              {todayDayName}
              {activeDay === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) && (
                <span className="badge badge-success" style={{ marginLeft: 10, fontSize: '0.7rem', verticalAlign: 'middle' }}>Today</span>
              )}
            </h2>

            {dayMenu ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {MEALS.map(meal => {
                  const mealData = dayMenu[meal];
                  return (
                    <div key={meal} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '14px 18px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(167,139,250,0.08))',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {MEAL_LABELS[meal]}
                        </p>
                        {mealData?.time && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            ⏰ {mealData.time}
                          </p>
                        )}
                      </div>
                      <div style={{ padding: '14px 18px' }}>
                        {mealData?.items?.length ? (
                          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {mealData.items.map((item, i) => (
                              <li key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                              }}>
                                <span style={{ color: 'var(--accent)', fontSize: '0.5rem' }}>●</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Not scheduled
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <p>No menu for {todayDayName}</p>
                </div>
              </div>
            )}

            {/* Full Week Preview */}
            <div style={{ marginTop: 36 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Full Week Overview
              </h3>
              <div className="menu-grid">
                {menu.menu?.map(dayM => (
                  <div key={dayM.day} className="menu-day-card">
                    <div className="menu-day-header">
                      <div className="menu-day-name">{dayM.day}</div>
                    </div>
                    {MEALS.map(meal => (
                      <div key={meal} className="meal-section">
                        <div className="meal-label">{MEAL_LABELS[meal]}</div>
                        <div className="meal-items">
                          {dayM[meal]?.items?.slice(0, 3).join(' · ')}
                          {dayM[meal]?.items?.length > 3 && ` +${dayM[meal].items.length - 3} more`}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
