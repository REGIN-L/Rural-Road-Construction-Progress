const express = require('express');
const router = express.Router();
const {
    createPublicQuery,
    getPublicQueries,
    getPublicQueryById,
    updatePublicQueryStatus,
    respondToPublicQuery,
    getMySubmissions,
    getPublicQueryStats,
    approveAndCreateProjectFromQuery
} = require('../controllers/publicQueryController');
const { protect, adminOnly, engineerOrAdmin } = require('../middleware/auth');
const mongoose = require('mongoose');
const User = require('../models/User');
const localStore = require('../utils/localStore');

// Public query & request statistics
router.get('/stats', getPublicQueryStats);

// Submissions by logged-in citizen
router.get('/my-submissions', protect, getMySubmissions);

// Public submission — optional auth to associate user
router.post('/', async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = require('jsonwebtoken');
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ruralconnect_super_secret_jwt_key_2026_college_project');
            if (decoded && decoded.id) {
                if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(decoded.id)) {
                    req.user = await User.findById(decoded.id).select('-password');
                }
                if (!req.user) {
                    req.user = localStore.findUserById(decoded.id);
                }
                if (!req.user) {
                    // Check if decoded ID was legacy user_citizen
                    if (decoded.id === 'user_citizen') {
                        req.user = localStore.findUserById('6ae35de2aa61c21ada558a6e') || {
                            _id: '6ae35de2aa61c21ada558a6e',
                            name: 'Ramesh Patel (Citizen)',
                            email: 'citizen@ruralconnect.gov.in',
                            role: 'PUBLIC'
                        };
                    } else {
                        req.user = decoded;
                    }
                }
            }
        } catch (_) {
            // Not authenticated — fine, proceed anonymously
        }
    }
    next();
}, createPublicQuery);

router.get('/', getPublicQueries);
router.get('/track/:id', getPublicQueryById);
router.get('/:id', getPublicQueryById);

// Staff-only updates (Admin or Engineer)
router.put('/:id', protect, engineerOrAdmin, updatePublicQueryStatus);
router.put('/:id/status', protect, engineerOrAdmin, updatePublicQueryStatus);
router.put('/:id/response', protect, engineerOrAdmin, respondToPublicQuery);

// Admin-only road request conversion to official project
router.post('/:id/convert-to-project', protect, adminOnly, approveAndCreateProjectFromQuery);

module.exports = router;
