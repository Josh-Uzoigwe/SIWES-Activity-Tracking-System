const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

// List students (scoped by role in controller)
router.get('/', studentController.getStudents);

// Get specific student
router.get('/:id', studentController.getStudentById);

// Coordinator clears student for SIWES
const { authorize } = require('../middlewares/auth');
router.put('/:id/clear', authorize('COORDINATOR'), studentController.clearStudent);

// Coordinator rejects/flags student
router.put('/:id/reject', authorize('COORDINATOR'), studentController.rejectStudent);

module.exports = router;
