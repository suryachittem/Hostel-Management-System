const express = require('express');
const router = express.Router();
const {
  getCurrentMenu,
  getAllMenus,
  createOrUpdateMenu,
  updateMenu,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');

router.get('/current', protect, getCurrentMenu);
router.get('/', protect, authorize('admin'), getAllMenus);
router.post('/', protect, authorize('admin'), createOrUpdateMenu);
router.put('/:id', protect, authorize('admin'), updateMenu);

module.exports = router;
