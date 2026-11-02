const mongoose = require('mongoose');
const PublicQuery = require('../models/PublicQuery');
const Project = require('../models/Project');
const User = require('../models/User');
const localStore = require('../utils/localStore');

// Helper to generate reference ID e.g. RCQ-2026-0001 (guaranteed unique & collision-free)
const generateQueryId = async () => {
    const year = new Date().getFullYear();
    const prefix = `RCQ-${year}-`;
    const isMongo = mongoose.connection.readyState === 1;

    let maxNum = 0;
    if (isMongo) {
        try {
            const queries = await PublicQuery.find({ queryId: new RegExp(`^${prefix}\\d+`) }).select('queryId').lean();
            for (const q of queries) {
                const match = q.queryId && q.queryId.match(/RCQ-\d{4}-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                }
            }
        } catch (_) {}
    } else {
        const localList = localStore.data?.publicQueries || [];
        for (const q of localList) {
            const match = q.queryId && q.queryId.match(/RCQ-\d{4}-(\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        }
    }

    let nextNum = maxNum + 1;
    let candidate = `${prefix}${String(nextNum).padStart(4, '0')}`;

    if (isMongo) {
        while (await PublicQuery.exists({ queryId: candidate })) {
            nextNum++;
            candidate = `${prefix}${String(nextNum).padStart(4, '0')}`;
        }
    } else {
        while ((localStore.data?.publicQueries || []).some(q => q.queryId === candidate)) {
            nextNum++;
            candidate = `${prefix}${String(nextNum).padStart(4, '0')}`;
        }
    }

    return candidate;
};

// @desc    Submit a public road query, feedback, or new road construction request
// @route   POST /api/public-queries
// @access  Public (No authentication required; optional user linkage)
exports.createPublicQuery = async (req, res, next) => {
    try {
        const {
            name,
            contactInfo,
            queryType,
            requestType,
            roadName,
            startPoint,
            endPoint,
            reason,
            urgency,
            state,
            district,
            location,
            village,
            description,
            image,
            projectId,
            priority
        } = req.body;

        const effectiveLocation = location || village || '';
        const effectiveVillage = village || location || '';
        const effectiveState = state || 'Tamil Nadu';
        const effectiveRequestType = requestType || (queryType === 'Request New Road' ? 'NEW_ROAD_REQUEST' : 'FEEDBACK');
        const effectiveQueryType = queryType || (effectiveRequestType === 'NEW_ROAD_REQUEST' ? 'Request New Road' : 'General Feedback');
        const effectiveUrgency = urgency || priority || 'Medium';

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Please provide your name.' });
        }

        if (!district || !district.trim()) {
            return res.status(400).json({ success: false, message: 'District is required.' });
        }

        if (!effectiveLocation.trim()) {
            return res.status(400).json({ success: false, message: 'Village / Location is required.' });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({ success: false, message: 'Description of the feedback or road request is required.' });
        }

        // Capture and validate authenticated citizen user if available
        const isMongo = mongoose.connection.readyState === 1;

        let submittedByUserId = null;
        if (req.user) {
            const rawUserId = req.user._id || req.user.id;
            const isHex24 = typeof rawUserId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawUserId);

            if (isHex24 && mongoose.Types.ObjectId.isValid(rawUserId)) {
                submittedByUserId = new mongoose.Types.ObjectId(rawUserId);
            } else if (rawUserId instanceof mongoose.Types.ObjectId) {
                submittedByUserId = rawUserId;
            } else if (req.user.email) {
                // If citizen account is verified by token/email, resolve actual MongoDB _id
                try {
                    if (isMongo) {
                        const matchedUser = await User.findOne({ email: req.user.email.toLowerCase() }).select('_id');
                        if (matchedUser && mongoose.Types.ObjectId.isValid(matchedUser._id)) {
                            submittedByUserId = matchedUser._id;
                        }
                    } else {
                        const localUser = localStore.findUserByEmail(req.user.email);
                        if (localUser && mongoose.Types.ObjectId.isValid(localUser._id)) {
                            submittedByUserId = new mongoose.Types.ObjectId(localUser._id);
                        }
                    }
                } catch (_) {
                    submittedByUserId = null;
                }
            }
        }

        // Hard safeguard against any placeholder, username, or invalid ObjectId string
        if (!submittedByUserId || !mongoose.Types.ObjectId.isValid(submittedByUserId) || String(submittedByUserId) === 'user_citizen') {
            submittedByUserId = null;
        }

        // Resolve Project reference if provided
        let resolvedProjectObjectId = null;
        if (projectId && isMongo) {
            if (mongoose.Types.ObjectId.isValid(projectId)) {
                resolvedProjectObjectId = projectId;
            } else {
                const foundProject = await Project.findOne({ projectId });
                if (foundProject) resolvedProjectObjectId = foundProject._id;
            }
        }

        if (!isMongo) {
            const newQuery = localStore.createPublicQuery({
                name,
                contactInfo: contactInfo || '',
                queryType: effectiveQueryType,
                requestType: effectiveRequestType,
                roadName: roadName || '',
                startPoint: startPoint || '',
                endPoint: endPoint || '',
                reason: reason || '',
                urgency: effectiveUrgency,
                state: effectiveState,
                district,
                location: effectiveLocation,
                village: effectiveVillage,
                description,
                image: image || '',
                projectId: resolvedProjectObjectId || projectId || null,
                priority: effectiveUrgency,
                submittedByUserId
            });

            return res.status(201).json({
                success: true,
                message: effectiveRequestType === 'NEW_ROAD_REQUEST'
                    ? 'Your road construction request has been submitted successfully. Use your Reference ID to track status.'
                    : 'Your feedback / road issue has been submitted successfully. Use your Reference ID to track status.',
                data: newQuery
            });
        }

        let query = null;
        let attempts = 0;
        while (!query && attempts < 5) {
            attempts++;
            const queryId = await generateQueryId();

            try {
                query = await PublicQuery.create({
                    queryId,
                    name: name.trim(),
                    contactInfo: (contactInfo || '').trim(),
                    queryType: effectiveQueryType,
                    requestType: effectiveRequestType,
                    roadName: (roadName || '').trim(),
                    startPoint: (startPoint || '').trim(),
                    endPoint: (endPoint || '').trim(),
                    reason: (reason || '').trim(),
                    urgency: effectiveUrgency,
                    priority: effectiveUrgency,
                    state: effectiveState.trim(),
                    district: district.trim(),
                    location: effectiveLocation.trim(),
                    village: effectiveVillage.trim(),
                    description: description.trim(),
                    image: (image || '').trim(),
                    projectId: resolvedProjectObjectId,
                    status: 'Submitted',
                    submittedByUserId
                });
            } catch (createErr) {
                if ((createErr.code === 11000 || String(createErr.message).includes('duplicate key') || String(createErr.message).includes('queryId')) && attempts < 5) {
                    continue;
                }
                throw createErr;
            }
        }

        // Populate project info if linked
        if (query && query.projectId) {
            await query.populate('projectId', 'projectId projectName village district roadLength');
        }

        res.status(201).json({
            success: true,
            message: effectiveRequestType === 'NEW_ROAD_REQUEST'
                ? 'Your road construction request has been submitted successfully. Use your Reference ID to track status.'
                : 'Your feedback / road issue has been submitted successfully. Use your Reference ID to track status.',
            data: query
        });
    } catch (error) {
        if (error.code === 11000 && String(error.message).includes('queryId')) {
            return res.status(409).json({
                success: false,
                message: 'A reference ID collision was detected. Please click submit again.'
            });
        }
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors || {}).map(e => {
                if (e.name === 'CastError' || e.name === 'BSONError' || String(e.message).includes('Cast to ObjectId')) {
                    return `Invalid reference format for ${e.path || 'record'}.`;
                }
                return e.message;
            });
            return res.status(400).json({
                success: false,
                message: msgs.join('. ') || 'Validation error while submitting feedback or request.'
            });
        }
        if (error.name === 'CastError' || error.name === 'BSONError' || String(error.message).includes('Cast to ObjectId')) {
            return res.status(400).json({
                success: false,
                message: `Invalid reference format for ${error.path || 'record'}.`
            });
        }
        next(error);
    }
};

// @desc    Get public queries (Admin & Engineer can see all, filter by status, type, etc.)
// @route   GET /api/public-queries
// @access  Public / Staff
exports.getPublicQueries = async (req, res, next) => {
    try {
        const { status, queryType, requestType, queryId, projectId } = req.query;
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const queries = localStore.getPublicQueries({ status, queryType, queryId, requestType });
            return res.json({
                success: true,
                count: queries.length,
                data: queries
            });
        }

        let filter = {};
        if (status && status !== 'All') {
            if (status === 'Submitted' || status === 'Pending') {
                filter.status = { $in: ['Submitted', 'Pending'] };
            } else {
                filter.status = status;
            }
        }
        if (queryType && queryType !== 'All') filter.queryType = queryType;
        if (requestType && requestType !== 'All') filter.requestType = requestType;
        if (queryId) filter.queryId = new RegExp(queryId, 'i');
        if (projectId) {
            if (mongoose.Types.ObjectId.isValid(projectId)) {
                filter.projectId = projectId;
            } else {
                const foundProj = await Project.findOne({ projectId });
                if (foundProj) filter.projectId = foundProj._id;
            }
        }

        const queries = await PublicQuery.find(filter)
            .populate('projectId', 'projectId projectName village district roadLength')
            .populate('createdProjectId', 'projectId projectName status')
            .populate('submittedByUserId', 'name email role')
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
                return res.status(404).json({ success: false, message: 'Reference ID not found' });
            }
            return res.json({
                success: true,
                data: query
            });
        }

        let query;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query = await PublicQuery.findById(req.params.id)
                .populate('projectId', 'projectId projectName village district roadLength')
                .populate('createdProjectId', 'projectId projectName status')
                .populate('submittedByUserId', 'name email role');
        } else {
            query = await PublicQuery.findOne({ queryId: req.params.id.trim().toUpperCase() })
                .populate('projectId', 'projectId projectName village district roadLength')
                .populate('createdProjectId', 'projectId projectName status')
                .populate('submittedByUserId', 'name email role');
        }

        if (!query) {
            return res.status(404).json({ success: false, message: `Reference ID ${req.params.id} not found` });
        }

        res.json({
            success: true,
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update public query status (Staff: Admin or Engineer)
// @route   PUT /api/public-queries/:id/status
// @access  Private (Staff only)
exports.updatePublicQueryStatus = async (req, res, next) => {
    try {
        const { status, adminResponse, staffNotes } = req.body;
        const validStatuses = ['Submitted', 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const query = localStore.updatePublicQuery(req.params.id, { status, adminResponse, staffNotes });
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
        if (adminResponse !== undefined) updateData.adminResponse = adminResponse;
        if (staffNotes !== undefined) updateData.staffNotes = staffNotes;

        let query;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query = await PublicQuery.findByIdAndUpdate(req.params.id, updateData, { new: true })
                .populate('projectId', 'projectId projectName')
                .populate('createdProjectId', 'projectId projectName');
        } else {
            query = await PublicQuery.findOneAndUpdate({ queryId: req.params.id }, updateData, { new: true })
                .populate('projectId', 'projectId projectName')
                .populate('createdProjectId', 'projectId projectName');
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

// @desc    Add official response / remarks to public query
// @route   PUT /api/public-queries/:id/response
// @access  Private (Staff only)
exports.respondToPublicQuery = async (req, res, next) => {
    try {
        const { adminResponse, status, staffNotes } = req.body;

        if (adminResponse === undefined || adminResponse === null) {
            return res.status(400).json({ success: false, message: 'Response text is required' });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const query = localStore.updatePublicQuery(req.params.id, { adminResponse, status, staffNotes });
            if (!query) {
                return res.status(404).json({ success: false, message: 'Query not found' });
            }
            return res.json({
                success: true,
                message: 'Official response saved successfully',
                data: query
            });
        }

        const updateData = { adminResponse, updatedAt: new Date() };
        if (status) updateData.status = status;
        if (staffNotes !== undefined) updateData.staffNotes = staffNotes;

        let query;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query = await PublicQuery.findByIdAndUpdate(req.params.id, updateData, { new: true })
                .populate('projectId', 'projectId projectName')
                .populate('createdProjectId', 'projectId projectName');
        } else {
            query = await PublicQuery.findOneAndUpdate({ queryId: req.params.id }, updateData, { new: true })
                .populate('projectId', 'projectId projectName')
                .populate('createdProjectId', 'projectId projectName');
        }

        if (!query) {
            return res.status(404).json({ success: false, message: 'Query not found' });
        }

        res.json({
            success: true,
            message: 'Official response saved successfully',
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's submitted queries/requests
// @route   GET /api/public-queries/my-submissions
// @access  Private (Authenticated Citizen)
exports.getMySubmissions = async (req, res, next) => {
    try {
        const rawUserId = req.user ? (req.user.id || req.user._id) : null;
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const all = localStore.getPublicQueries({});
            const userQueries = all.filter(q => String(q.submittedByUserId) === String(rawUserId) || (req.user && req.user.email && q.contactInfo?.includes(req.user.email)));
            return res.json({
                success: true,
                count: userQueries.length,
                data: userQueries
            });
        }

        const isHex24 = typeof rawUserId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawUserId);
        let validUserObjectId = null;
        if (isHex24) {
            validUserObjectId = new mongoose.Types.ObjectId(rawUserId);
        } else if (rawUserId instanceof mongoose.Types.ObjectId) {
            validUserObjectId = rawUserId;
        } else if (req.user && req.user.email) {
            const foundUser = await User.findOne({ email: req.user.email.toLowerCase() }).select('_id');
            if (foundUser) validUserObjectId = foundUser._id;
        }

        const orConditions = [];
        if (validUserObjectId) {
            orConditions.push({ submittedByUserId: validUserObjectId });
        }
        if (req.user && req.user.email) {
            orConditions.push({ contactInfo: new RegExp(req.user.email, 'i') });
        }
        if (req.user && req.user.phone) {
            orConditions.push({ contactInfo: new RegExp(req.user.phone, 'i') });
        }

        if (orConditions.length === 0) {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        const queries = await PublicQuery.find({ $or: orConditions })
            .populate('projectId', 'projectId projectName village district')
            .populate('createdProjectId', 'projectId projectName status')
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

// @desc    Get public query & request statistics
// @route   GET /api/public-queries/stats
// @access  Public
exports.getPublicQueryStats = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const queries = localStore.getPublicQueries({});
            return res.json({
                success: true,
                data: {
                    total: queries.length,
                    pending: queries.filter(q => q.status === 'Pending' || q.status === 'Submitted').length,
                    underReview: queries.filter(q => q.status === 'Under Review').length,
                    inProgress: queries.filter(q => q.status === 'In Progress').length,
                    resolved: queries.filter(q => q.status === 'Resolved').length,
                    rejected: queries.filter(q => q.status === 'Rejected').length,
                    roadRequests: queries.filter(q => q.requestType === 'NEW_ROAD_REQUEST' || q.queryType === 'Request New Road').length,
                    feedbacks: queries.filter(q => q.requestType !== 'NEW_ROAD_REQUEST' && q.queryType !== 'Request New Road').length
                }
            });
        }

        const [
            total,
            submitted,
            underReview,
            inProgress,
            resolved,
            rejected,
            roadRequests,
            feedbacks
        ] = await Promise.all([
            PublicQuery.countDocuments(),
            PublicQuery.countDocuments({ status: { $in: ['Submitted', 'Pending'] } }),
            PublicQuery.countDocuments({ status: 'Under Review' }),
            PublicQuery.countDocuments({ status: 'In Progress' }),
            PublicQuery.countDocuments({ status: 'Resolved' }),
            PublicQuery.countDocuments({ status: 'Rejected' }),
            PublicQuery.countDocuments({ $or: [{ requestType: 'NEW_ROAD_REQUEST' }, { queryType: 'Request New Road' }] }),
            PublicQuery.countDocuments({ $and: [{ requestType: { $ne: 'NEW_ROAD_REQUEST' } }, { queryType: { $ne: 'Request New Road' } }] })
        ]);

        res.json({
            success: true,
            data: {
                total,
                pending: submitted,
                submitted,
                underReview,
                inProgress,
                resolved,
                rejected,
                roadRequests,
                feedbacks
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Approve a citizen road request and create an official Project
// @route   POST /api/public-queries/:id/convert-to-project
// @access  Private (Admin ONLY)
exports.approveAndCreateProjectFromQuery = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied: Only an authorized Admin can create official projects from requests.' });
        }

        const queryIdParam = req.params.id;
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            return res.status(400).json({ success: false, message: 'Database connection required for official project creation' });
        }

        const query = await PublicQuery.findOne({
            $or: [
                { _id: queryIdParam.match(/^[0-9a-fA-F]{24}$/) ? queryIdParam : null },
                { queryId: queryIdParam.toUpperCase() }
            ]
        });

        if (!query) {
            return res.status(404).json({ success: false, message: 'Road request not found' });
        }

        if (query.isApprovedForProject && query.createdProjectId) {
            return res.status(400).json({ success: false, message: 'This road request has already been converted into an official project.' });
        }

        const {
            projectId,
            projectName,
            roadLength,
            allocatedBudget,
            startDate,
            expectedCompletion,
            contractor
        } = req.body;

        // Generate official project ID if not supplied e.g. RC-REQ-xxxx
        const finalProjectId = projectId || `RC-${Date.now().toString().slice(-4)}`;
        const finalProjectName = projectName || query.roadName || `${query.location} Village Connectivity Road`;
        const finalRoadLength = Number(roadLength) || 5.0;
        const finalBudget = Number(allocatedBudget) || 25000000;
        const finalStartDate = startDate || new Date().toISOString();
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const finalExpectedCompletion = expectedCompletion || futureDate.toISOString();

        // Check if projectId exists
        const existing = await Project.findOne({ projectId: finalProjectId });
        if (existing) {
            return res.status(400).json({ success: false, message: `Project ID ${finalProjectId} already exists.` });
        }

        const newProject = await Project.create({
            projectId: finalProjectId,
            projectName: finalProjectName,
            village: query.village || query.location,
            district: query.district,
            state: query.state || 'Tamil Nadu',
            roadLength: finalRoadLength,
            allocatedBudget: finalBudget,
            amountSpent: 0,
            startDate: finalStartDate,
            expectedCompletion: finalExpectedCompletion,
            currentProgress: 0,
            contractor: contractor || 'Unassigned Contractor',
            createdBy: req.user._id,
            creatorRole: 'ADMIN',
            description: `Official construction project approved from citizen request ${query.queryId}. ${query.description}`,
            publicDescription: `Sanctioned road construction project based on public request ${query.queryId} for ${query.village || query.location}, ${query.district}.`,
            status: 'Planned',
            isPublic: true,
            showContractor: true,
            showFinancialData: true
        });

        // Update the public query
        query.status = 'Resolved';
        query.isApprovedForProject = true;
        query.createdProjectId = newProject._id;
        query.adminResponse = `Approved by Administration. Official construction project created: "${newProject.projectName}" (ID: ${newProject.projectId}).`;
        await query.save();

        res.status(201).json({
            success: true,
            message: `Official road construction project "${newProject.projectName}" (${newProject.projectId}) created successfully!`,
            project: newProject,
            query,
            data: {
                project: newProject,
                query
            }
        });
    } catch (error) {
        next(error);
    }
};
