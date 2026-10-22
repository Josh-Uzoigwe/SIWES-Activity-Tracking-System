require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const logRoutes = require('./routes/log.routes');
const placementRoutes = require('./routes/placement.routes');
const studentRoutes = require('./routes/student.routes');
const visitRoutes = require('./routes/visit.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const institutionRoutes = require('./routes/institution.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

// General API rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

// Restrict CORS: Allow localhost/LAN origins in development
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile native apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // In development, allow localhost and LAN IP origins (Expo, Vite, emulator)
    if (isDev && (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin))) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

// Limit JSON body size to prevent payload DoS
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes — auth endpoints get the stricter rate limiter
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/institutions', institutionRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/placements', placementRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
