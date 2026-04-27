const User = require('../models/User');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      aadhaar: user.aadhaar,
      profilePhoto: user.profilePhoto,
      room: user.room,
      feeAmount: user.feeAmount,
      feeDueDate: user.feeDueDate,
    },
  });
};

// @desc    Register student
// @route   POST /api/auth/register
// @access  Public
exports.registerStudent = async (req, res, next) => {
  try {
    const { name, email, password, phone, aadhaar } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check Aadhaar uniqueness
    if (aadhaar) {
      const existingAadhaar = await User.findOne({ aadhaar });
      if (existingAadhaar) {
        return res.status(400).json({ success: false, message: 'Aadhaar number already registered' });
      }
    }

    // Handle profile photo
    let profilePhoto = '';
    let profilePhotoPublicId = '';
    if (req.file) {
      profilePhoto = req.file.path || req.file.secure_url || `/uploads/${req.file.filename}`;
      profilePhotoPublicId = req.file.filename || req.file.public_id || '';
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      aadhaar,
      profilePhoto,
      profilePhotoPublicId,
      role: 'student',
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or Aadhaar already in use' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Login user (admin or student)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password').populate('room');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('room');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
