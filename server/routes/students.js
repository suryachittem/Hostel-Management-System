const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { upload } = require('../config/cloudinary');

// @desc    Get student profile
router.get('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate('room')
      .select('-password');
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update student profile
router.put('/profile', protect, authorize('student'), upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = { name, phone };

    if (req.file) {
      updateData.profilePhoto = req.file.path || req.file.secure_url || `/uploads/${req.file.filename}`;
      updateData.profilePhotoPublicId = req.file.filename || req.file.public_id || '';
    }

    const student = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('room')
      .select('-password');

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
