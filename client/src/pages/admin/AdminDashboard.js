import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';
import AdminOverview from '../../components/admin/AdminOverview';
import StudentsManager from '../../components/admin/StudentsManager';
import RoomsManager from '../../components/admin/RoomsManager';
import MenuManager from '../../components/admin/MenuManager';
import PaymentsManager from '../../components/admin/PaymentsManager';

const adminLinks = [
  {
    label: 'Main',
    items: [
      { to: '/admin', end: true, icon: '📊', label: 'Overview' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/students', icon: '👩‍🎓', label: 'Students' },
      { to: '/admin/rooms', icon: '🛏️', label: 'Rooms' },
      { to: '/admin/payments', icon: '💳', label: 'Payments' },
      { to: '/admin/menu', icon: '🍽️', label: 'Food Menu' },
    ],
  },
];

export default function AdminDashboard() {
  return (
    <div className="app-layout">
      <Sidebar links={adminLinks} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/students" element={<StudentsManager />} />
          <Route path="/rooms" element={<RoomsManager />} />
          <Route path="/payments" element={<PaymentsManager />} />
          <Route path="/menu" element={<MenuManager />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
