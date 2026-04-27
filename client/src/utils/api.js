import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const registerStudent = (formData) =>
  API.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMe = () => API.get('/auth/me');
export const updatePassword = (data) => API.put('/auth/password', data);

// Student
export const getStudentProfile = () => API.get('/students/profile');
export const updateStudentProfile = (formData) =>
  API.put('/students/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Rooms
export const getAllRooms = () => API.get('/rooms');
export const getRoomById = (id) => API.get(`/rooms/${id}`);
export const createRoom = (data) => API.post('/rooms', data);
export const updateRoom = (id, data) => API.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => API.delete(`/rooms/${id}`);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAllStudents = (params) => API.get('/admin/students', { params });
export const getStudentById = (id) => API.get(`/admin/students/${id}`);
export const updateStudentAdmin = (id, data) => API.put(`/admin/students/${id}`, data);
export const assignRoom = (data) => API.post('/admin/assign-room', data);
export const removeFromRoom = (data) => API.post('/admin/remove-room', data);
export const getAdminPayments = (params) => API.get('/admin/payments', { params });

// Payments
export const createCheckoutSession = (data) => API.post('/payments/create-checkout-session', data);
export const verifyPayment = (data) => API.post('/payments/verify', data);
export const getMyPayments = () => API.get('/payments/my-payments');
export const getPaymentById = (id) => API.get(`/payments/${id}`);

// Food Menu
export const getCurrentMenu = () => API.get('/menu/current');
export const getAllMenus = () => API.get('/menu');
export const createMenu = (data) => API.post('/menu', data);
export const updateMenu = (id, data) => API.put(`/menu/${id}`, data);

export default API;
