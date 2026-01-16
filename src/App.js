const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./db');

// Import routes
const loginRoutes = require('./routes/loginRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const pageRoutes = require('./routes/pageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from views directory
app.use('/css', express.static(path.join(__dirname, 'views/css')));
app.use('/js', express.static(path.join(__dirname, 'views/js')));
app.use(express.static(path.join(__dirname, 'views')));

// Session middleware
app.use(session({
  secret: 'ssms-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// --- Authentication Middleware ---
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// --- Role-based Authorization Middleware ---
const authorize = (role) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    if (req.session.user.role !== role) {
      return res.status(403).send('Access denied');
    }
    next();
  };
};

// --- Routes ---
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Login routes
app.use('/login', loginRoutes);

// Session management routes
app.use('/api/auth', sessionRoutes);

// General page routes
app.use('/dashboard', requireAuth, pageRoutes);

// Protected role-based routes
app.use('/admin', authorize('admin'), adminRoutes);
app.use('/teacher', authorize('lecturer'), teacherRoutes);
app.use('/student', authorize('student'), studentRoutes);

const startApp = async () => {
  // Connect to Database
  await connectDB();
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log("📚 Student Management System is ready!");
  });
};

startApp();