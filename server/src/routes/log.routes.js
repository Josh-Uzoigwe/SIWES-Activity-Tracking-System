const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const upload = require('../middlewares/upload');

// All log routes require authentication
router.use(authenticate);

// Student uploads photo or document evidence for a log
router.post('/upload-evidence', authorize('STUDENT'), upload.single('evidence'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.status(200).json({
    success: true,
    file_url: `/uploads/${req.file.filename}`
  });
});

// Student submits a new log or resubmits a rejected one
router.post('/', authorize('STUDENT'), logController.createLog);

// Get logs (scoped by role inside the controller)
router.get('/', logController.getLogs);

// Get specific log by ID
router.get('/:id', logController.getLogById);

// School Supervisor reviews a log
router.put('/:id/review', authorize('SCHOOL'), logController.reviewLog);

// Industry Supervisor endorses a log
router.put('/:id/endorse', authorize('INDUSTRY'), logController.endorseLog);

module.exports = router;
