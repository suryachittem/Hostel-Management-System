const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllStudents,
  getStudentById,
  updateStudent,
  assignRoom,
  removeFromRoom,
  getAllPayments,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.post('/assign-room', assignRoom);
router.post('/remove-room', removeFromRoom);
router.get('/payments', getAllPayments);

module.exports = router;
