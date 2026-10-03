const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const localStore = require('../utils/localStore');

// Protect routes
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ruralconnect_super_secret_jwt_key_2026_college_project');

            if (mongoose.connection.readyState === 1) {
                req.user = await User.findById(decoded.id).select('-password');
            } else {
                req.user = localStore.findUserById(decoded.id);
            }

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User account not found' });
            }
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
};

// Engineer or Admin middleware
const engineerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'ENGINEER')) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied: Engineer or Admin privileges required' });
};

const projectViewer = (req, res, next) => {
    if (req.user && ['ADMIN', 'ENGINEER', 'CONTRACTOR'].includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied: authenticated project access required' });
};

const progressUpdater = (req, res, next) => {
    if (req.user && ['ADMIN', 'ENGINEER', 'CONTRACTOR'].includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied: project progress updates require an authorized role' });
};

module.exports = { protect, adminOnly, engineerOrAdmin, projectViewer, progressUpdater };
