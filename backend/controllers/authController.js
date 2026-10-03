const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const localStore = require('../utils/localStore');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'ruralconnect_super_secret_jwt_key_2026_college_project', {
        expiresIn: '30d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const adminSetupKey = process.env.ADMIN_SIGNUP_KEY || 'ruralconnect-admin-setup-key';

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (isMongo) {
            const userExists = await User.findOne({ email: email.toLowerCase() });
            if (userExists) {
                return res.status(400).json({ success: false, message: 'User with this email already exists' });
            }

            if (role === 'ADMIN' && req.headers['x-admin-setup-key'] !== adminSetupKey) {
                return res.status(403).json({ success: false, message: 'Admin signup requires the configured administrator setup key' });
            }

            const user = await User.create({
                name,
                email: email.toLowerCase(),
                password,
                role: ['ADMIN', 'ENGINEER', 'CONTRACTOR'].includes(role) ? role : 'ENGINEER'
            });

            const token = generateToken(user._id);

            return res.status(201).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            // Local fallback store
            const userExists = localStore.findUserByEmail(email);
            if (userExists) {
                return res.status(400).json({ success: false, message: 'User with this email already exists' });
            }

            if (role === 'ADMIN' && req.headers['x-admin-setup-key'] !== adminSetupKey) {
                return res.status(403).json({ success: false, message: 'Admin signup requires the configured administrator setup key' });
            }

            const user = await localStore.createUser({
                name,
                email,
                password,
                role
            });

            const token = generateToken(user._id);

            return res.status(201).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (isMongo) {
            const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const token = generateToken(user._id);

            return res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            // Local fallback store
            const user = localStore.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const isMatch = await localStore.matchPassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const token = generateToken(user._id);

            return res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;
        let user;
        if (isMongo) {
            user = await User.findById(req.user.id || req.user._id);
        } else {
            user = localStore.findUserById(req.user.id || req.user._id);
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

