const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  items: [{ type: String }],
  time: { type: String }, // e.g. "7:00 AM - 9:00 AM"
});

const DayMenuSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  breakfast: MealSchema,
  lunch: MealSchema,
  snacks: MealSchema,
  dinner: MealSchema,
});

const FoodMenuSchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      default: 'Weekly Menu',
    },
    menu: [DayMenuSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    specialNote: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodMenu', FoodMenuSchema);
