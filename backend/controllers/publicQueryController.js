const mongoose = require('mongoose');
const PublicQuery = require('../models/PublicQuery');
const localStore = require('../utils/localStore');

// Helper to generate reference ID e.g. RCQ-2026-0001
const generateQueryId = async () => {
    const year = new Date().getFullYear();
    const count = await PublicQuery.countDocuments();
    return `RCQ-${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Submit a public road query / issue
// @route   POST /api/public-queries
// @access  Public (No authentication required)
exports.createPublicQuery = async (req, res, next) => {
    try {
        const {
            name,
            contactInfo,
            queryType,
            state,
            district,
            location,
            description,
            image,
            projectId
        } = req.body;

        // Validation
        if (!name || !queryType || !state || !district || !location || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, query type, state, district, location, and description.'
            });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const newQuery = localStore.createPublicQuery({
                name,
                contactInfo: contactInfo || '',
                queryType,
                state,
                district,
                location,
                description,
                image: image || '',
                projectId: projectId || null
            });

            return res.status(201).json({
                success: true,
                message: 'Your query has been submitted successfully. Use your Query ID to track status.',
                data: newQuery
            });
        }

        const queryId = await generateQueryId();

        const query = await PublicQuery.create({
            queryId,
            name,
            contactInfo: contactInfo || '',
            queryType,
            state,
            district,
            location,
            description,
            image: image || '',
            projectId: projectId || null,
            status: 'Pending'
        });

        res.status(201).json({
            success: true,
            message: 'Your query has been submitted successfully. Use your Query ID to track status.',
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get public queries (Admin sees all; Public can search by queryId)
// @route   GET /api/public-queries
// @access  Public / Admin
exports.getPublicQueries = async (req, res, next) => {
    try {
        const { status, queryType, queryId } = req.query;
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const queries = localStore.getPublicQueries({ status, queryType, queryId });
            return res.json({
                success: true,
                count: queries.length,
                data: queries
            });
        }

        let filter = {};
        if (status && status !== 'All') filter.status = status;
        if (queryType && queryType !== 'All') filter.queryType = queryType;
        if (queryId) filter.queryId = new RegExp(queryId, 'i');

        const queries = await PublicQuery.find(filter)
            .populate('projectId', 'projectId projectName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: queries.length,
            data: queries
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single public query by ID or queryId
// @route   GET /api/public-queries/:id
// @access  Public
exports.getPublicQueryById = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const query = localStore.getPublicQueryById(req.params.id);
            if (!query) {
                return res.status(404).json({ success: false, message: 'Query not found' });
            }
            return res.json({
                success: true,
                data: query
            });
        }

        let query;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query = await PublicQuery.findById(req.params.id).populate('projectId', 'projectId projectName');
        } else {
            query = await PublicQuery.findOne({ queryId: req.params.id }).populate('projectId', 'projectId projectName');
        }

        if (!query) {
            return res.status(404).json({ success: false, message: 'Query not found' });
        }

        res.json({
            success: true,
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update public query status (Admin)
// @route   PUT /api/public-queries/:id/status
// @access  Private (Admin only)
exports.updatePublicQueryStatus = async (req, res, next) => {
    try {
        const { status, adminResponse } = req.body;
        const validStatuses = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const query = localStore.updatePublicQuery(req.params.id, { status, adminResponse });
            if (!query) {
                return res.status(404).json({ success: false, message: 'Query not found' });
            }
            return res.json({
                success: true,
                message: `Query status updated to ${status}`,
                data: query
            });
        }

        const updateData = { status, updatedAt: new Date() };
        if (adminResponse !== undefined) {
            updateData.adminResponse = adminResponse;
        }

        let query;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query = await PublicQuery.findByIdAndUpdate(req.params.id, updateData, { new: true });
        } else {
            query = await PublicQuery.findOneAndUpdate({ queryId: req.params.id }, updateData, { new: true });
        }

        if (!query) {
            return res.status(404).json({ success: false, message: 'Query not found' });
        }

        res.json({
            success: true,
            message: `Query status updated to ${status}`,
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add admin response to public query
// @route   PUT /api/public-queries/:id/response
// @access  Private (Admin only)
exports.respondToPublicQuery = async (req, res, next) => {
    try {
        const { adminResponse, status } = req.body;

        if (adminResponse === undefined || adminResponse === null) {
            return res.status(400).json({ success: false, message: 'Admin response text is required' });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const query = localStore.updatePublicQuery(req.params.id, { adminResponse, status });
            if (!query) {
                return res.status(404).json({ success: false, message: 'Query not found' });
            }
            return res.json({
                success: true,
                message: 'Admin response saved successfully',
                data: query
            });
        }

        const updateData = { adminResponse, updatedAt: new Date() };
        if (status) {
            updateData.status = status;
        }

        let query;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query = await PublicQuery.findByIdAndUpdate(req.params.id, updateData, { new: true });
        } else {
            query = await PublicQuery.findOneAndUpdate({ queryId: req.params.id }, updateData, { new: true });
        }

        if (!query) {
            return res.status(404).json({ success: false, message: 'Query not found' });
        }

        res.json({
            success: true,
            message: 'Admin response saved successfully',
            data: query
        });
    } catch (error) {
        next(error);
    }
};
