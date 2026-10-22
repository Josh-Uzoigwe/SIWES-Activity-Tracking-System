const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const exportController = require('../controllers/export.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const upload = require('../middlewares/upload');

router.use(authenticate);

// Get all final reports (ITF/Coordinator scoped)
router.get('/final', authorize('ITF', 'COORDINATOR'), reportController.getReports);

// Student gets their own final report status
router.get('/final/me', authorize('STUDENT'), reportController.getMyReport);

// Student uploads final report
router.post('/final', authorize('STUDENT'), upload.single('report'), reportController.uploadReport);

// ITF Officer verifies stipend
router.put('/final/:id/verify', authorize('ITF'), reportController.verifyStipend);

// Export logbook
router.get('/export/logbook/:studentId', authorize('STUDENT', 'SCHOOL', 'INDUSTRY', 'COORDINATOR', 'ITF'), exportController.exportLogbook);

// Export institution placement report
router.get('/export/institution/:institutionId', authorize('COORDINATOR', 'ITF'), exportController.exportInstitutionReport);

// Export ITF national report
router.get('/export/itf-national', authorize('ITF'), exportController.exportItfNational);

module.exports = router;
