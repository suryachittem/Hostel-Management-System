const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Student
exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, paymentMonth, description } = req.body;
    const student = req.user;

    if (!student.room) {
      return res.status(400).json({ success: false, message: 'No room assigned yet. Contact admin.' });
    }

    // Check if already paid for this month
    const existing = await Payment.findOne({
      student: student._id,
      paymentMonth,
      status: 'completed',
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Fee already paid for this month' });
    }

    const amountInPaise = Math.round(amount * 100); // Convert to paise (INR smallest unit)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Hostel Fee - ${paymentMonth}`,
              description: description || `Room fee payment for ${student.name}`,
              metadata: { studentId: student._id.toString() },
            },
            unit_amount: amountInPaise,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: student.email,
      metadata: {
        studentId: student._id.toString(),
        roomId: student.room.toString(),
        paymentMonth,
      },
      success_url: `${process.env.CLIENT_URL}/student/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/student/dashboard`,
    });

    // Create pending payment record
    const payment = await Payment.create({
      student: student._id,
      room: student.room,
      amount,
      currency: 'inr',
      stripeSessionId: session.id,
      status: 'pending',
      paymentMonth,
      description: description || 'Hostel Fee Payment',
    });

    res.json({ success: true, sessionId: session.id, sessionUrl: session.url, paymentId: payment._id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment creation failed' });
  }
};

// @desc    Verify payment after success redirect
// @route   POST /api/payments/verify
// @access  Student
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    // Find and update payment record
    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: sessionId },
      {
        status: 'completed',
        stripePaymentIntentId: session.payment_intent,
        paidAt: new Date(),
      },
      { new: true }
    )
      .populate('student', 'name email phone aadhaar profilePhoto')
      .populate('room', 'roomNumber type sharing');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe)
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: 'completed', stripePaymentIntentId: session.payment_intent, paidAt: new Date() }
    );
  }

  res.json({ received: true });
};

// @desc    Get student's payment history
// @route   GET /api/payments/my-payments
// @access  Student
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .populate('room', 'roomNumber type sharing')
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get payment by ID (for receipt)
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name email phone aadhaar profilePhoto')
      .populate('room', 'roomNumber type sharing floor');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Students can only view their own payments
    if (req.user.role === 'student' && payment.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
