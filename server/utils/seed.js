const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Room = require('../models/Room');
const FoodMenu = require('../models/FoodMenu');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostel_management');
  console.log('✅ MongoDB Connected');
};

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Room.deleteMany({});
  await FoodMenu.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@hostel.com',
    password: 'admin123',
    role: 'admin',
    phone: '9999999999',
    isActive: true,
  });
  console.log('👤 Admin created: admin@hostel.com / admin123');

  // Create Rooms
  const roomsData = [
    { roomNumber: '101', floor: 1, type: 'AC', sharing: 'Single', capacity: 1, monthlyFee: 8000, amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Study Table'] },
    { roomNumber: '102', floor: 1, type: 'AC', sharing: 'Double', capacity: 2, monthlyFee: 5500, amenities: ['WiFi', 'AC', 'Attached Bathroom'] },
    { roomNumber: '103', floor: 1, type: 'Non-AC', sharing: 'Triple', capacity: 3, monthlyFee: 3500, amenities: ['WiFi', 'Common Bathroom', 'Ceiling Fan'] },
    { roomNumber: '201', floor: 2, type: 'AC', sharing: 'Double', capacity: 2, monthlyFee: 5500, amenities: ['WiFi', 'AC', 'Attached Bathroom'] },
    { roomNumber: '202', floor: 2, type: 'Non-AC', sharing: 'Single', capacity: 1, monthlyFee: 6000, amenities: ['WiFi', 'Ceiling Fan', 'Attached Bathroom'] },
    { roomNumber: '203', floor: 2, type: 'AC', sharing: 'Triple', capacity: 3, monthlyFee: 4000, amenities: ['WiFi', 'AC', 'Common Bathroom'] },
    { roomNumber: '301', floor: 3, type: 'Non-AC', sharing: 'Double', capacity: 2, monthlyFee: 4500, amenities: ['WiFi', 'Ceiling Fan'] },
    { roomNumber: '302', floor: 3, type: 'AC', sharing: 'Single', capacity: 1, monthlyFee: 9000, amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Balcony', 'Mini Fridge'] },
  ];

  const rooms = await Room.insertMany(roomsData);
  console.log(`🏠 ${rooms.length} rooms created`);

  // Create Students
  const studentsData = [
    { name: 'Arjun Sharma', email: 'arjun@student.com', password: 'student123', phone: '9876543210', aadhaar: '123456789012', role: 'student' },
    { name: 'Priya Patel', email: 'priya@student.com', password: 'student123', phone: '9876543211', aadhaar: '123456789013', role: 'student' },
    { name: 'Rahul Kumar', email: 'rahul@student.com', password: 'student123', phone: '9876543212', aadhaar: '123456789014', role: 'student' },
    { name: 'Sneha Reddy', email: 'sneha@student.com', password: 'student123', phone: '9876543213', aadhaar: '123456789015', role: 'student' },
  ];

  const students = await User.create(studentsData);
  console.log(`👩‍🎓 ${students.length} students created`);

  // Assign rooms to students
  const room101 = rooms.find(r => r.roomNumber === '101');
  const room102 = rooms.find(r => r.roomNumber === '102');

  // Assign student 1 to room 101
  await User.findByIdAndUpdate(students[0]._id, { room: room101._id, feeAmount: room101.monthlyFee });
  await Room.findByIdAndUpdate(room101._id, { $push: { students: students[0]._id }, isAvailable: false });

  // Assign students 2 & 3 to room 102
  await User.findByIdAndUpdate(students[1]._id, { room: room102._id, feeAmount: room102.monthlyFee });
  await User.findByIdAndUpdate(students[2]._id, { room: room102._id, feeAmount: room102.monthlyFee });
  await Room.findByIdAndUpdate(room102._id, {
    $push: { students: { $each: [students[1]._id, students[2]._id] } },
    isAvailable: false,
  });

  console.log('🏠 Rooms assigned to students');

  // Create Food Menu
  const weekMenu = await FoodMenu.create({
    title: 'Weekly PG Menu',
    weekStartDate: new Date(),
    isActive: true,
    updatedBy: admin._id,
    specialNote: 'Sunday special: Biryani for lunch!',
    menu: [
      {
        day: 'Monday',
        breakfast: { name: 'Breakfast', time: '7:30 AM - 9:00 AM', items: ['Idli', 'Sambar', 'Coconut Chutney', 'Tea/Coffee'] },
        lunch: { name: 'Lunch', time: '12:30 PM - 2:00 PM', items: ['Rice', 'Dal Fry', 'Aloo Gobi', 'Chapati', 'Curd', 'Pickle'] },
        snacks: { name: 'Evening Snacks', time: '5:00 PM - 6:00 PM', items: ['Biscuits', 'Tea', 'Bread Butter'] },
        dinner: { name: 'Dinner', time: '8:00 PM - 9:30 PM', items: ['Chapati', 'Paneer Butter Masala', 'Rice', 'Dal', 'Salad'] },
      },
      {
        day: 'Tuesday',
        breakfast: { name: 'Breakfast', time: '7:30 AM - 9:00 AM', items: ['Poha', 'Boiled Eggs', 'Bread Toast', 'Tea/Coffee'] },
        lunch: { name: 'Lunch', time: '12:30 PM - 2:00 PM', items: ['Rice', 'Rajma', 'Jeera Aloo', 'Chapati', 'Buttermilk'] },
        snacks: { name: 'Evening Snacks', time: '5:00 PM - 6:00 PM', items: ['Samosa', 'Tea', 'Juice'] },
        dinner: { name: 'Dinner', time: '8:00 PM - 9:30 PM', items: ['Chapati', 'Mix Veg Curry', 'Rice', 'Dal Tadka', 'Salad'] },
      },
      {
        day: 'Wednesday',
        breakfast: { name: 'Breakfast', time: '7:30 AM - 9:00 AM', items: ['Upma', 'Coconut Chutney', 'Banana', 'Tea/Coffee'] },
        lunch: { name: 'Lunch', time: '12:30 PM - 2:00 PM', items: ['Rice', 'Sambar', 'Rasam', 'Papad', 'Curd', 'Chapati'] },
        snacks: { name: 'Evening Snacks', time: '5:00 PM - 6:00 PM', items: ['Pakoda', 'Tea', 'Biscuits'] },
        dinner: { name: 'Dinner', time: '8:00 PM - 9:30 PM', items: ['Chapati', 'Chana Masala', 'Rice', 'Dal', 'Raita'] },
      },
      {
        day: 'Thursday',
        breakfast: { name: 'Breakfast', time: '7:30 AM - 9:00 AM', items: ['Paratha', 'Curd', 'Pickle', 'Tea/Coffee'] },
        lunch: { name: 'Lunch', time: '12:30 PM - 2:00 PM', items: ['Rice', 'Dal Makhani', 'Bhindi Fry', 'Chapati', 'Salad'] },
        snacks: { name: 'Evening Snacks', time: '5:00 PM - 6:00 PM', items: ['Maggi', 'Tea'] },
        dinner: { name: 'Dinner', time: '8:00 PM - 9:30 PM', items: ['Chapati', 'Kadai Paneer', 'Rice', 'Soup', 'Salad'] },
      },
      {
        day: 'Friday',
        breakfast: { name: 'Breakfast', time: '7:30 AM - 9:00 AM', items: ['Dosa', 'Sambar', 'Chutney', 'Tea/Coffee'] },
        lunch: { name: 'Lunch', time: '12:30 PM - 2:00 PM', items: ['Fried Rice', 'Manchurian', 'Chapati', 'Dal', 'Curd'] },
        snacks: { name: 'Evening Snacks', time: '5:00 PM - 6:00 PM', items: ['Bread Pakoda', 'Tea', 'Juice'] },
        dinner: { name: 'Dinner', time: '8:00 PM - 9:30 PM', items: ['Chapati', 'Palak Paneer', 'Rice', 'Dal Fry', 'Raita'] },
      },
      {
        day: 'Saturday',
        breakfast: { name: 'Breakfast', time: '7:30 AM - 9:00 AM', items: ['Puri Bhaji', 'Jalebi', 'Tea/Coffee'] },
        lunch: { name: 'Lunch', time: '12:30 PM - 2:00 PM', items: ['Pulao', 'Raita', 'Chapati', 'Shahi Paneer', 'Sweet'] },
        snacks: { name: 'Evening Snacks', time: '5:00 PM - 6:00 PM', items: ['Popcorn', 'Cold Drink'] },
        dinner: { name: 'Dinner', time: '8:00 PM - 9:30 PM', items: ['Chapati', 'Veg Handi', 'Rice', 'Dal', 'Ice Cream'] },
      },
      {
        day: 'Sunday',
        breakfast: { name: 'Breakfast', time: '8:00 AM - 10:00 AM', items: ['Chole Bhature', 'Lassi', 'Tea/Coffee'] },
        lunch: { name: 'Lunch', time: '1:00 PM - 2:30 PM', items: ['Veg Biryani', 'Raita', 'Salan', 'Chapati', 'Gulab Jamun'] },
        snacks: { name: 'Evening Snacks', time: '5:00 PM - 6:00 PM', items: ['Cake Slice', 'Tea', 'Biscuits'] },
        dinner: { name: 'Dinner', time: '8:00 PM - 9:30 PM', items: ['Chapati', 'Dal Makhani', 'Jeera Rice', 'Papad', 'Salad'] },
      },
    ],
  });
  console.log('🍽️  Food menu created');

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Admin Login:   admin@hostel.com / admin123');
  console.log('👩‍🎓 Student Login: arjun@student.com / student123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
