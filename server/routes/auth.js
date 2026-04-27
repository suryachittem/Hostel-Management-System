const express = require('express');
const router = express.Router();
const { registerStudent, login, getMe, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/register', upload.single('profilePhoto'), registerStudent);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;
