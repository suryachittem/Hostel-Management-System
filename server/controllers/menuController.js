const FoodMenu = require('../models/FoodMenu');

// @desc    Get active/current food menu
// @route   GET /api/menu/current
// @access  Private
exports.getCurrentMenu = async (req, res) => {
  try {
    const menu = await FoodMenu.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('updatedBy', 'name');

    res.json({ success: true, menu });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all menus
// @route   GET /api/menu
// @access  Admin
exports.getAllMenus = async (req, res) => {
  try {
    const menus = await FoodMenu.find()
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, menus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create/update food menu
// @route   POST /api/menu
// @access  Admin
exports.createOrUpdateMenu = async (req, res) => {
  try {
    const { title, weekStartDate, menu, specialNote } = req.body;

    // Deactivate previous menus
    await FoodMenu.updateMany({}, { isActive: false });

    const newMenu = await FoodMenu.create({
      title,
      weekStartDate,
      menu,
      specialNote,
      isActive: true,
      updatedBy: req.user._id,
    });

    res.status(201).json({ success: true, menu: newMenu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update existing menu
// @route   PUT /api/menu/:id
// @access  Admin
exports.updateMenu = async (req, res) => {
  try {
    const { title, menu, specialNote, isActive } = req.body;

    if (isActive) {
      await FoodMenu.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    }

    const updatedMenu = await FoodMenu.findByIdAndUpdate(
      req.params.id,
      { title, menu, specialNote, isActive, updatedBy: req.user._id },
      { new: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    res.json({ success: true, menu: updatedMenu });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
