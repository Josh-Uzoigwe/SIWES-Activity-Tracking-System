const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.post('/register/student', authController.registerStudent);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/google/complete-registration', authController.completeGoogleRegistration);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes

// Only coordinators can register supervisors
router.post('/register/supervisor', authenticate, authorize('COORDINATOR'), authController.registerSupervisor);

// List supervisors (for Coordinators and ITF)
router.get('/supervisors', authenticate, authorize('COORDINATOR', 'ITF'), authController.getSupervisors);

// Get current user profile (Student or any Supervisor)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
