const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: 0,
    },
    type: {
      type: String,
      enum: ['AC', 'Non-AC'],
      required: [true, 'Room type is required'],
    },
    sharing: {
      type: String,
      enum: ['Single', 'Double', 'Triple'],
      required: [true, 'Sharing type is required'],
    },
    // Max occupancy based on sharing type
    capacity: {
      type: Number,
      default: function () {
        const map = { Single: 1, Double: 2, Triple: 3 };
        return map[this.sharing] || 1;
      },
    },
    // Currently assigned students
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    monthlyFee: {
      type: Number,
      required: [true, 'Monthly fee is required'],
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: current occupancy count
RoomSchema.virtual('occupancy').get(function () {
  return this.students.length;
});

// Virtual: is full
RoomSchema.virtual('isFull').get(function () {
  return this.students.length >= this.capacity;
});

// Auto-update isAvailable
RoomSchema.pre('save', function (next) {
  this.isAvailable = this.students.length < this.capacity;
  next();
});

RoomSchema.set('toJSON', { virtuals: true });
RoomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Room', RoomSchema);
