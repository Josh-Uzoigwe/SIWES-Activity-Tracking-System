const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visit.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// List visits
router.get('/', visitController.getVisits);

// Schedule a visit (Only Supervisors or Coordinators)
router.post('/', authorize('SCHOOL', 'INDUSTRY', 'COORDINATOR'), visitController.scheduleVisit);

// Update visit status
router.put('/:id', authorize('SCHOOL', 'INDUSTRY', 'COORDINATOR'), visitController.updateVisitStatus);

module.exports = router;
