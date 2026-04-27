const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  verifyPayment,
  stripeWebhook,
  getMyPayments,
  getPaymentById,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Stripe webhook - raw body required (handled in index.js)
router.post('/webhook', stripeWebhook);

// Protected routes
router.post('/create-checkout-session', protect, authorize('student'), createCheckoutSession);
router.post('/verify', protect, verifyPayment);
router.get('/my-payments', protect, authorize('student'), getMyPayments);
router.get('/:id', protect, getPaymentById);

module.exports = router;
