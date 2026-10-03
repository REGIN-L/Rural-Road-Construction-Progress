const express = require('express');
const router = express.Router();
const {
    getDeletionRequests,
    createDeletionRequest,
    approveDeletionRequest,
    rejectDeletionRequest
} = require('../controllers/deletionRequestController');
const { protect, adminOnly, engineerOrAdmin } = require('../middleware/auth');

router.use(protect);

router.get('/', engineerOrAdmin, getDeletionRequests);
router.post('/', engineerOrAdmin, createDeletionRequest);
router.put('/:id/approve', adminOnly, approveDeletionRequest);
router.put('/:id/reject', adminOnly, rejectDeletionRequest);

module.exports = router;
