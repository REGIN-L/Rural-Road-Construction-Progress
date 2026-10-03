const express = require('express');
const router = express.Router();
const {
    createPublicQuery,
    getPublicQueries,
    getPublicQueryById,
    updatePublicQueryStatus,
    respondToPublicQuery
} = require('../controllers/publicQueryController');
const { protect, adminOnly } = require('../middleware/auth');

// Public route to submit queries and check status
router.post('/', createPublicQuery);
router.get('/', getPublicQueries);
router.get('/:id', getPublicQueryById);

// Admin-only management routes
router.put('/:id/status', protect, adminOnly, updatePublicQueryStatus);
router.put('/:id/response', protect, adminOnly, respondToPublicQuery);

module.exports = router;
