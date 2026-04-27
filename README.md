<div align="center">

# 🏠 Hostel Management System

### A Full-Stack MERN Application for Modern Hostel Administration

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-6366f1?style=for-the-badge)](https://hostel-management-client-pv9v.onrender.com/login)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)

<br/>

> A production-ready hostel management platform with secure JWT authentication, Stripe payment integration, PDF receipt generation, role-based dashboards for admin and students, and a beautiful dark UI.

<br/>

**[🌐 Live Demo](https://hostel-management-client-pv9v.onrender.com/login)** 

</div>

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with bcrypt password hashing (12 salt rounds)
- Separate login flows for **Admin** and **Student** roles
- Role-based access control — admins can't access student routes and vice versa
- Protected API routes with middleware-level authorization

### 👨‍💼 Admin Features
- 📊 **Dashboard** — Live stats: total students, rooms, revenue, pending fees
- 👩‍🎓 **Student Management** — Add, view, search, and manage all students
- 🛏️ **Room Management** — Create AC/Non-AC rooms with Single/Double/Triple sharing
- 🔑 **Room Assignment** — Assign students to rooms with one click
- 💳 **Payment Tracking** — Full payment history with status filters
- 🍽️ **Food Menu** — Publish and update weekly PG meal schedule

### 👩‍🎓 Student Features
- 🏠 **Room Details** — View assigned room info, type, amenities, sharing
- 💰 **Fee Payment** — Pay hostel fees securely via Stripe Checkout
- 🧾 **PDF Receipts** — Auto-generated downloadable PDF after every payment
- 🍽️ **Food Menu** — View today's meals + full weekly schedule
- 👤 **Profile Management** — Update name, phone, profile photo, password

### 💳 Payment System
- Stripe Checkout integration (hosted, secure)
- Webhook support for reliable payment confirmation
- Payment history with receipt numbers
- Professional PDF receipt generation with jsPDF

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 18, React Router v6, Context API |
| **Styling** | Custom CSS Design System (Dark Theme) |
| **HTTP Client** | Axios |
| **PDF Generation** | jsPDF + jsPDF-AutoTable |
| **Payments** | Stripe Checkout + Webhooks |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose ODM |
| **Authentication** | JWT + bcryptjs |
| **File Upload** | Multer + Cloudinary |
| **Hosting** | Render (Backend + Frontend) |
| **DB Hosting** | MongoDB Atlas |

</div>

---

## 🚀 Live Demo

### 🌐 [https://hostel-management-client-pv9v.onrender.com/login](https://hostel-management-client-pv9v.onrender.com/login)

> ⚠️ Hosted on Render free tier — may take **30–60 seconds** to wake up on first visit.

### Demo Credentials

<div align="center">

| Role | Email | Password |
|:----:|:------|:--------:|
| 👨‍💼 **Admin** | `admin@hostel.com` | `admin123` |
| 👩‍🎓 **Student** | `arjun@student.com` | `student123` |
| 👩‍🎓 **Student** | `priya@student.com` | `student123` |

</div>

### 💳 Test Payment Card

```
Card Number : **** **** **** ****
Expiry      : MM/YY
CVC         : ***
ZIP         : *****
```

---

## 📁 Project Structure

```
hostel-management/
│
├── 📁 server/                      # Node.js + Express Backend
│   ├── 📁 config/
│   │   ├── db.js                   # MongoDB connection
│   │   └── cloudinary.js           # File upload config
│   ├── 📁 controllers/
│   │   ├── authController.js       # Register, Login, JWT
│   │   ├── adminController.js      # Admin CRUD operations
│   │   ├── roomController.js       # Room management
│   │   ├── paymentController.js    # Stripe integration
│   │   └── menuController.js       # Food menu CRUD
│   ├── 📁 middleware/
│   │   └── auth.js                 # JWT protect + role guard
│   ├── 📁 models/
│   │   ├── User.js                 # Student & Admin schema
│   │   ├── Room.js                 # Room schema
│   │   ├── Payment.js              # Payment + receipt schema
│   │   └── FoodMenu.js             # Weekly menu schema
│   ├── 📁 routes/                  # Express route definitions
│   ├── 📁 utils/
│   │   └── seed.js                 # Database seeder
│   ├── index.js                    # App entry point
│   └── .env.example                # Environment template
│
└── 📁 client/                      # React Frontend
    └── 📁 src/
        ├── 📁 components/
        │   ├── 📁 admin/           # Admin dashboard components
        │   ├── 📁 student/         # Student dashboard components
        │   └── 📁 shared/          # Sidebar, shared UI
        ├── 📁 context/
        │   └── AuthContext.js      # Global auth state
        ├── 📁 pages/               # Route-level pages
        ├── 📁 styles/
        │   └── global.css          # Dark design system
        └── 📁 utils/
            ├── api.js              # Axios API layer
            └── generatePDF.js      # jsPDF receipt generator
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js `v18+`
- MongoDB (local) or MongoDB Atlas URI
- Stripe account (free test keys)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/hostel-management.git
cd hostel-management
```

### 2. Configure Backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/hostel_management
JWT_SECRET=your_super_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CLIENT_URL=http://localhost:3000
```

### 3. Configure Frontend

```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### 4. Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 5. Seed the Database

```bash
cd server
npm run seed
```

Output:
```
✅ MongoDB Connected
👤 Admin created: admin@hostel.com / admin123
🏠 8 rooms created
👩‍🎓 4 students created
🍽️  Food menu created
✅ Seed complete!
```

### 6. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 3000)
cd client && npm start
```

Open **http://localhost:3000** 🎉

---

## 🌐 Deployment

### Deploy to Render

#### Backend (Web Service)
| Setting | Value |
|---------|-------|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `node index.js` |

**Environment Variables:**
```
PORT                  = 5000
NODE_ENV              = production
MONGO_URI             = mongodb+srv://...
JWT_SECRET            = your_secret
STRIPE_SECRET_KEY     = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
CLIENT_URL            = https://your-frontend.onrender.com
```

#### Frontend (Static Site)
| Setting | Value |
|---------|-------|
| Root Directory | `client` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `build` |

**Environment Variables:**
```
REACT_APP_API_URL                = https://your-api.onrender.com/api
REACT_APP_STRIPE_PUBLISHABLE_KEY = pk_test_...
```

#### Stripe Webhook
Add endpoint in [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks):
```
https://your-api.onrender.com/api/payments/webhook
```
Events: `checkout.session.completed`

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/auth/register` | Register student | Public |
| `POST` | `/api/auth/login` | Login | Public |
| `GET` | `/api/auth/me` | Get current user | Private |
| `PUT` | `/api/auth/password` | Change password | Private |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/students` | List all students (paginated) |
| `POST` | `/api/admin/assign-room` | Assign room to student |
| `GET` | `/api/admin/payments` | All payment history |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rooms` | List all rooms |
| `POST` | `/api/rooms` | Create room |
| `PUT` | `/api/rooms/:id` | Update room |
| `DELETE` | `/api/rooms/:id` | Delete room |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/create-checkout-session` | Create Stripe session |
| `POST` | `/api/payments/verify` | Verify after redirect |
| `GET` | `/api/payments/my-payments` | Student history |
| `POST` | `/api/payments/webhook` | Stripe webhook |

---

## 🗄️ Database Schema

```
Users Collection
├── name, email, password (bcrypt)
├── role: 'admin' | 'student'
├── phone, aadhaar, profilePhoto
└── room (ref), feeAmount, feeDueDate

Rooms Collection
├── roomNumber, floor
├── type: 'AC' | 'Non-AC'
├── sharing: 'Single' | 'Double' | 'Triple'
├── capacity, monthlyFee
└── students: [User ref]

Payments Collection
├── student (ref), room (ref)
├── amount, currency, paymentMonth
├── stripeSessionId, stripePaymentIntentId
├── status: 'pending' | 'completed' | 'failed'
└── receiptNumber, paidAt

FoodMenu Collection
└── menu: [{ day, breakfast, lunch, snacks, dinner }]
```

---

## 🔒 Security

- ✅ Passwords hashed with **bcrypt** (12 salt rounds)
- ✅ **JWT tokens** expire in 7 days
- ✅ All sensitive routes protected with **auth middleware**
- ✅ Role-based access prevents cross-role data access
- ✅ Aadhaar numbers **masked** in all UI displays
- ✅ Stripe webhook signature **verified** on every request
- ✅ Environment variables kept out of version control

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/AmazingFeature`
3. Commit your changes — `git commit -m 'Add AmazingFeature'`
4. Push to the branch — `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
