const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placement.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Get placement by student ID
router.get('/:studentId', placementController.getPlacementByStudentId);

// Register or update placement (Students submit their own attachment; Coordinators can also manage)
router.post('/', authorize('COORDINATOR', 'STUDENT'), placementController.createPlacement);

// Assign supervisors to a placement (Coordinator only)
router.put('/:id', authorize('COORDINATOR'), placementController.assignSupervisors);

module.exports = router;
