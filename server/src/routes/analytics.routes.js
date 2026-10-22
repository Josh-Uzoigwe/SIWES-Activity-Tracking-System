const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Get analytics (ITF sees system-wide, Coordinator sees institution-wide)
router.get('/', authorize('ITF', 'COORDINATOR'), analyticsController.getAnalytics);

module.exports = router;
