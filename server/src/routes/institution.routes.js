const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institution.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Public route: get all accredited institutions for signup dropdown
router.get('/', institutionController.getInstitutions);

// Protected route: ITF Officer onboards new institution and its coordinator
router.post('/', authenticate, authorize('ITF'), institutionController.onboardInstitution);

module.exports = router;
