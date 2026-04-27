const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency:              { type: String,  default: 'inr' },
    stripePaymentIntentId: { type: String,  default: '' },
    stripeSessionId:       { type: String,  default: '' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String, default: 'stripe' },
    paymentMonth:  { type: String, required: true },
    description:   { type: String, default: 'Hostel Fee Payment' },
    receiptNumber: { type: String, default: '' },  // no unique index — generated in pre-save
    receiptUrl:    { type: String, default: '' },
    paidAt:        { type: Date,   default: null },
  },
  { timestamps: true }
);

// Auto-generate receipt number
PaymentSchema.pre('save', async function (next) {
  try {
    if (!this.receiptNumber || this.receiptNumber === '') {
      const count = await mongoose.model('Payment').countDocuments();
      const year  = new Date().getFullYear();
      const rand  = Math.floor(Math.random() * 1000); // extra uniqueness
      this.receiptNumber = `HMS-${year}-${String(count + 1).padStart(5, '0')}-${rand}`;
    }
    if (this.status === 'completed' && !this.paidAt) {
      this.paidAt = new Date();
    }
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
