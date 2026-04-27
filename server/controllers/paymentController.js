const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User    = require('../models/User');

// ─────────────────────────────────────────────────────────────
// POST /api/payments/create-checkout-session
// ─────────────────────────────────────────────────────────────
exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, paymentMonth, description } = req.body;
    const student = req.user;

    if (!student.room) {
      return res.status(400).json({ success: false, message: 'No room assigned yet. Contact admin.' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    // Already paid this month?
    const existing = await Payment.findOne({
      student: student._id,
      paymentMonth,
      status: 'completed',
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Fee already paid for this month.' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `Hostel Fee - ${paymentMonth}`,
            description: description || `Room fee for ${student.name}`,
          },
          unit_amount: amountInPaise,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: student.email,
      metadata: {
        studentId:    student._id.toString(),
        roomId:       student.room.toString(),
        paymentMonth: paymentMonth,
      },
      success_url: `${process.env.CLIENT_URL}/student/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.CLIENT_URL}/student`,
    });

    // Delete any old pending record for same student+month to avoid duplicates
    await Payment.deleteMany({
      student:      student._id,
      paymentMonth: paymentMonth,
      status:       'pending',
    });

    // Create fresh pending record
    const payment = await Payment.create({
      student:         student._id,
      room:            student.room,
      amount:          Number(amount),
      currency:        'inr',
      stripeSessionId: session.id,
      status:          'pending',
      paymentMonth:    paymentMonth,
      description:     description || 'Hostel Fee Payment',
    });

    return res.json({
      success:    true,
      sessionId:  session.id,
      sessionUrl: session.url,
      paymentId:  payment._id,
    });
  } catch (error) {
    console.error('createCheckoutSession ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Payment creation failed' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payments/verify
// ─────────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    // Get session from Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeErr) {
      console.error('Stripe retrieve error:', stripeErr.message);
      return res.status(400).json({ success: false, message: `Stripe error: ${stripeErr.message}` });
    }

    console.log('Stripe session status:', session.payment_status);

    if (!['paid', 'no_payment_required'].includes(session.payment_status)) {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Stripe status: ${session.payment_status}`,
      });
    }

    const paymentIntentId = session.payment_intent || '';

    // Find existing record by sessionId
    let payment = await Payment.findOne({ stripeSessionId: sessionId });

    if (payment) {
      // Update existing record to completed
      payment.status                = 'completed';
      payment.stripePaymentIntentId = paymentIntentId;
      payment.paidAt                = new Date();
      await payment.save();
    } else {
      // No record found — create one (handles webhook-first scenario)
      console.warn('No payment record for session:', sessionId, '— creating now');
      const meta = session.metadata || {};
      payment = await Payment.create({
        student:               meta.studentId || null,
        room:                  meta.roomId    || null,
        amount:                (session.amount_total || 0) / 100,
        currency:              session.currency || 'inr',
        stripeSessionId:       sessionId,
        stripePaymentIntentId: paymentIntentId,
        status:                'completed',
        paymentMonth:          meta.paymentMonth || '',
        description:           'Hostel Fee Payment',
        paidAt:                new Date(),
      });
    }

    // Return with populated fields
    const populated = await Payment.findById(payment._id)
      .populate('student', 'name email phone aadhaar profilePhoto')
      .populate('room',    'roomNumber type sharing floor')
      .lean();

    return res.json({ success: true, payment: populated });
  } catch (error) {
    console.error('verifyPayment ERROR:', error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payments/webhook  (called by Stripe)
// ─────────────────────────────────────────────────────────────
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  // Skip signature check if secret not configured (dev/test)
  if (
    !process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET === 'whsec_your_webhook_secret'
  ) {
    try {
      const event = JSON.parse(req.body.toString());
      await handleStripeEvent(event);
    } catch (e) {
      console.error('Webhook parse error:', e.message);
    }
    return res.json({ received: true });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  await handleStripeEvent(event);
  return res.json({ received: true });
};

async function handleStripeEvent(event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Webhook: payment completed for session', session.id);
    try {
      await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status:                'completed',
          stripePaymentIntentId: session.payment_intent || '',
          paidAt:                new Date(),
        }
      );
    } catch (e) {
      console.error('Webhook DB update error:', e.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/payments/my-payments
// ─────────────────────────────────────────────────────────────
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .populate({
        path:    'room',
        select:  'roomNumber type sharing',
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, payments: payments || [] });
  } catch (error) {
    console.error('getMyPayments ERROR:', error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payments/:id
// ─────────────────────────────────────────────────────────────
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path:    'student',
        select:  'name email phone aadhaar profilePhoto',
        options: { strictPopulate: false },
      })
      .populate({
        path:    'room',
        select:  'roomNumber type sharing floor',
        options: { strictPopulate: false },
      })
      .lean();

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Students can only see their own payments
    if (
      req.user.role === 'student' &&
      payment.student &&
      payment.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return res.json({ success: true, payment });
  } catch (error) {
    console.error('getPaymentById ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
