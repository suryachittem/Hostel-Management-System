const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Admin
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('students', 'name email phone profilePhoto')
      .sort({ roomNumber: 1 });

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Admin
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('students', 'name email phone profilePhoto');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Admin
exports.createRoom = async (req, res) => {
  try {
    const { roomNumber, floor, type, sharing, monthlyFee, amenities, description } = req.body;

    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ success: false, message: 'Room number already exists' });
    }

    const capacityMap = { Single: 1, Double: 2, Triple: 3 };
    const room = await Room.create({
      roomNumber,
      floor,
      type,
      sharing,
      capacity: capacityMap[sharing],
      monthlyFee,
      amenities: amenities || [],
      description: description || '',
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Admin
exports.updateRoom = async (req, res) => {
  try {
    const { type, sharing, monthlyFee, amenities, description, floor } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Update capacity if sharing changes
    if (sharing && sharing !== room.sharing) {
      const capacityMap = { Single: 1, Double: 2, Triple: 3 };
      room.capacity = capacityMap[sharing];
    }

    if (type) room.type = type;
    if (sharing) room.sharing = sharing;
    if (monthlyFee !== undefined) room.monthlyFee = monthlyFee;
    if (amenities) room.amenities = amenities;
    if (description !== undefined) room.description = description;
    if (floor !== undefined) room.floor = floor;

    await room.save();

    // Update fee for all students in this room
    if (monthlyFee !== undefined) {
      await User.updateMany({ room: room._id }, { feeAmount: monthlyFee });
    }

    const updatedRoom = await Room.findById(room._id).populate('students', 'name email phone');
    res.json({ success: true, room: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (room.students.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with assigned students. Remove students first.',
      });
    }

    await room.deleteOne();
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
