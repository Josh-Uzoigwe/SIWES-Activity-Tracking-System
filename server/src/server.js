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

// 1. CORS Middleware (Must run FIRST so all responses including errors/429 carry CORS headers)
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

app.use(helmet());

// 2. General API rate limiter (relaxed in dev so local testing is never choked)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 10000 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isDev,
});
app.use('/api', limiter);

// 3. Stricter rate limiter for auth mutations (login/register brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 1000 : 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => isDev || req.method === 'GET',
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

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
