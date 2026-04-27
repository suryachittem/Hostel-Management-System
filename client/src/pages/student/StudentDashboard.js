import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';
import StudentOverview from '../../components/student/StudentOverview';
import StudentPayments from '../../components/student/StudentPayments';
import StudentMenu from '../../components/student/StudentMenu';
import StudentProfile from '../../components/student/StudentProfile';

const studentLinks = [
  {
    label: 'My Hostel',
    items: [
      { to: '/student', end: true, icon: '🏠', label: 'My Room' },
      { to: '/student/payments', icon: '💳', label: 'Payments' },
      { to: '/student/menu', icon: '🍽️', label: 'Food Menu' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/student/profile', icon: '👤', label: 'My Profile' },
    ],
  },
];

export default function StudentDashboard() {
  return (
    <div className="app-layout">
      <Sidebar links={studentLinks} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<StudentOverview />} />
          <Route path="/payments" element={<StudentPayments />} />
          <Route path="/menu" element={<StudentMenu />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </main>
    </div>
  );
}
