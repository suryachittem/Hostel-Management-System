const mongoose = require('mongoose');
const User    = require('../models/User');
const Room    = require('../models/Room');
const Payment = require('../models/Payment');

// ─── helper ────────────────────────────────────────────────
const safeCount = async (Model, query = {}) => {
  try { return await Model.countDocuments(query); }
  catch (e) { console.error('safeCount error:', e.message); return 0; }
};

// @desc  GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents  = await safeCount(User,  { role: 'student', isActive: true });
    const totalRooms     = await safeCount(Room);
    const availableRooms = await safeCount(Room,  { isAvailable: true });

    // payments — only fetch fields we need
    let payments = [];
    try {
      payments = await Payment.find({ status: 'completed' })
        .select('amount paymentMonth student')
        .lean();
    } catch (e) {
      console.error('Payment.find error in stats:', e.message);
    }

    const currentMonth   = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = payments
      .filter(p => p.paymentMonth === currentMonth)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const totalRevenue   = payments.reduce((s, p) => s + (p.amount || 0), 0);

    let paidThisMonth = [];
    try {
      paidThisMonth = await Payment.distinct('student', {
        paymentMonth: currentMonth,
        status: 'completed',
      });
    } catch (e) {
      console.error('Payment.distinct error in stats:', e.message);
    }

    return res.json({
      success: true,
      stats: {
        totalStudents,
        totalRooms,
        availableRooms,
        occupiedRooms:   totalRooms - availableRooms,
        monthlyRevenue,
        totalRevenue,
        pendingPayments: Math.max(0, totalStudents - paidThisMonth.length),
        paidThisMonth:   paidThisMonth.length,
      },
    });
  } catch (error) {
    console.error('getDashboardStats ERROR:', error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  GET /api/admin/students
exports.getAllStudents = async (req, res) => {
  try {
    const page      = Math.max(1, parseInt(req.query.page)  || 1);
    const limit     = Math.max(1, parseInt(req.query.limit) || 10);
    const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const skip      = (page - 1) * limit;

    const query = { role: 'student' };

    if (rawSearch.length > 0) {
      const safe = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re   = { $regex: safe, $options: 'i' };
      query.$or  = [
        { name:  re },
        { email: re },
        { phone: { $type: 'string', $regex: safe, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      User.find(query)
        .populate('room', 'roomNumber type sharing monthlyFee floor')
        .select('-password -profilePhotoPublicId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    let paidIds = [];
    try {
      paidIds = await Payment.distinct('student', {
        paymentMonth: currentMonth,
        status: 'completed',
      });
    } catch (e) {
      console.error('Payment.distinct error in students:', e.message);
    }
    const paidSet = new Set(paidIds.map(String));

    const studentsWithStatus = students.map(s => ({
      ...s,
      feeStatus: paidSet.has(String(s._id)) ? 'paid' : 'pending',
    }));

    return res.json({
      success: true,
      students: studentsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('getAllStudents ERROR:', error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  GET /api/admin/students/:id
exports.getStudentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .populate('room')
      .select('-password')
      .lean();

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    let payments = [];
    try {
      payments = await Payment.find({ student: student._id })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean();
    } catch (e) {
      console.error('Payment.find error in getStudentById:', e.message);
    }

    return res.json({ success: true, student, payments });
  } catch (error) {
    console.error('getStudentById ERROR:', error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  PUT /api/admin/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const { name, phone, feeAmount, feeDueDate, isActive } = req.body;
    const update = {};
    if (name       !== undefined) update.name       = name;
    if (phone      !== undefined) update.phone      = phone;
    if (feeAmount  !== undefined) update.feeAmount  = feeAmount;
    if (feeDueDate !== undefined) update.feeDueDate = feeDueDate;
    if (isActive   !== undefined) update.isActive   = isActive;

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      update,
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.json({ success: true, student });
  } catch (error) {
    console.error('updateStudent ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  POST /api/admin/assign-room
exports.assignRoom = async (req, res) => {
  try {
    const { studentId, roomId } = req.body;
    if (!studentId || !roomId) {
      return res.status(400).json({ success: false, message: 'studentId and roomId are required' });
    }

    const [student, room] = await Promise.all([
      User.findOne({ _id: studentId, role: 'student' }),
      Room.findById(roomId),
    ]);

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!room)    return res.status(404).json({ success: false, message: 'Room not found' });

    if (student.room && student.room.toString() !== roomId) {
      await Room.findByIdAndUpdate(student.room, { $pull: { students: studentId } });
    }

    const alreadyIn = room.students.map(String).includes(String(studentId));
    if (!alreadyIn) {
      if (room.students.length >= room.capacity) {
        return res.status(400).json({ success: false, message: 'Room is already full' });
      }
      room.students.push(studentId);
      await room.save();
    }

    student.room      = roomId;
    student.feeAmount = room.monthlyFee;
    await student.save();

    const updated = await User.findById(studentId).populate('room').select('-password');
    return res.json({ success: true, student: updated, message: 'Room assigned successfully' });
  } catch (error) {
    console.error('assignRoom ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  POST /api/admin/remove-room
exports.removeFromRoom = async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (student.room) {
      await Room.findByIdAndUpdate(student.room, { $pull: { students: studentId } });
    }
    student.room      = null;
    student.feeAmount = 0;
    await student.save();

    return res.json({ success: true, message: 'Student removed from room' });
  } catch (error) {
    console.error('removeFromRoom ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  GET /api/admin/payments
exports.getAllPayments = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    // Build filter — ignore empty string values from frontend
    const query = {};
    if (req.query.status && req.query.status.trim() !== '') {
      query.status = req.query.status.trim();
    }
    if (req.query.month && req.query.month.trim() !== '') {
      query.paymentMonth = req.query.month.trim();
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate({ path: 'student', select: 'name email phone profilePhoto', options: { strictPopulate: false } })
        .populate({ path: 'room',    select: 'roomNumber type sharing',        options: { strictPopulate: false } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return res.json({
      success: true,
      payments,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('getAllPayments ERROR:', error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message });
  }
};
