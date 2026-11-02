const express = require('express');
const router = express.Router();
const {
    createEditRequest,
    getEditRequests,
    getEditRequestById,
    approveEditRequest,
    rejectEditRequest
} = require('../controllers/projectEditRequestController');
const { protect, adminOnly, engineerOrAdmin } = require('../middleware/auth');

router.use(protect);

router.get('/', engineerOrAdmin, getEditRequests);
router.get('/my', engineerOrAdmin, getEditRequests);
router.get('/:id', engineerOrAdmin, getEditRequestById);
router.post('/', engineerOrAdmin, createEditRequest);
router.put('/:id/approve', adminOnly, approveEditRequest);
router.put('/:id/reject', adminOnly, rejectEditRequest);

module.exports = router;
