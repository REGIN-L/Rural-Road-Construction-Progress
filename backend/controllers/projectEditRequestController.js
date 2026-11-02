const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectEditRequest = require('../models/ProjectEditRequest');
const localStore = require('../utils/localStore');

// Whitelist of fields an engineer is permitted to propose edits for
const ALLOWED_EDIT_FIELDS = [
    'projectName',
    'village',
    'district',
    'state',
    'roadLength',
    'allocatedBudget',
    'amountSpent',
    'startDate',
    'expectedCompletion',
    'currentProgress',
    'contractor',
    'contractorId',
    'description',
    'publicDescription',
    'status',
    'isPublic',
    'showContractor',
    'showFinancialData'
];

/**
 * Filter and sanitize requested changes, removing protected security fields
 */
function sanitizeRequestedChanges(rawChanges) {
    if (!rawChanges || typeof rawChanges !== 'object') {
        return null;
    }

    const sanitized = {};
    for (const key of Object.keys(rawChanges)) {
        if (ALLOWED_EDIT_FIELDS.includes(key)) {
            let val = rawChanges[key];
            if (['roadLength', 'allocatedBudget', 'amountSpent', 'currentProgress'].includes(key) && val !== undefined && val !== '') {
                val = Number(val);
                if (isNaN(val)) continue;
            }
            if (['isPublic', 'showContractor', 'showFinancialData'].includes(key)) {
                val = Boolean(val);
            }
            sanitized[key] = val;
        }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : null;
}

// @desc    Submit an edit/change request for a project (Engineer / Admin)
// @route   POST /api/project-edit-requests OR POST /api/projects/:id/edit-request
// @access  Private (Engineer / Admin)
exports.createEditRequest = async (req, res, next) => {
    try {
        const projectId = req.params.id || req.body.projectId;
        const { requestedChanges, reason } = req.body;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'Project reference (projectId) is required' });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: 'A reason for the requested changes is required' });
        }

        const safeChanges = sanitizeRequestedChanges(requestedChanges);
        if (!safeChanges) {
            return res.status(400).json({
                success: false,
                message: 'No valid permitted editable fields were provided in requested changes'
            });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const project = localStore.getProjectById(projectId);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Engineer authorization check
            if (req.user.role === 'ENGINEER') {
                const isAssigned = String(project.assignedEngineer) === String(req.user._id || req.user.id);
                const isCreator = String(project.createdBy) === String(req.user._id || req.user.id);
                if (!isAssigned && !isCreator) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied: You are only authorized to request edits for your assigned projects'
                    });
                }
            }

            // Duplicate check
            const existingRequests = localStore.getEditRequests ? localStore.getEditRequests() : [];
            const hasPending = existingRequests.some(
                r => String(r.projectId) === String(project._id || project.projectId) && r.status === 'Pending'
            );
            if (hasPending) {
                return res.status(400).json({
                    success: false,
                    message: 'An edit request for this project is already pending administrator review'
                });
            }

            const newReq = localStore.createEditRequest({
                projectId: project._id || project.projectId,
                projectName: project.projectName,
                projectCode: project.projectId,
                requestedBy: req.user,
                requestedByRole: req.user.role,
                requestedChanges: safeChanges,
                reason: reason.trim()
            });

            return res.status(201).json({
                success: true,
                message: 'Project edit request submitted successfully for Admin review',
                data: newReq
            });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Engineer authorization check
        if (req.user.role === 'ENGINEER') {
            const isAssigned = String(project.assignedEngineer) === String(req.user._id);
            const isCreator = String(project.createdBy) === String(req.user._id);
            if (!isAssigned && !isCreator) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You are only authorized to request edits for your assigned projects'
                });
            }
        }

        // Duplicate request protection: check if there is already a Pending request
        const existingPending = await ProjectEditRequest.findOne({
            projectId: project._id,
            status: 'Pending'
        });

        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: 'An edit request for this project is already pending administrator review'
            });
        }

        const editRequest = await ProjectEditRequest.create({
            projectId: project._id,
            projectName: project.projectName,
            projectCode: project.projectId,
            requestedBy: req.user._id,
            requestedByRole: req.user.role,
            requestedChanges: safeChanges,
            reason: reason.trim(),
            status: 'Pending'
        });

        res.status(201).json({
            success: true,
            message: 'Project edit request submitted successfully for Admin review',
            data: editRequest
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all project edit requests
// @route   GET /api/project-edit-requests
// @access  Private (Admin sees all, Engineer sees their own)
exports.getEditRequests = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const requests = localStore.getEditRequests ? localStore.getEditRequests(req.user) : [];
            return res.json({
                success: true,
                count: requests.length,
                data: requests
            });
        }

        let query = {};
        if (req.user.role === 'ENGINEER') {
            query.requestedBy = req.user._id;
        }

        const requests = await ProjectEditRequest.find(query)
            .populate('projectId', 'projectId projectName village district state currentProgress status roadLength allocatedBudget amountSpent startDate expectedCompletion')
            .populate('requestedBy', 'name email role')
            .populate('reviewedBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project edit request by ID
// @route   GET /api/project-edit-requests/:id
// @access  Private (Admin or Requester)
exports.getEditRequestById = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const reqItem = localStore.getEditRequestById ? localStore.getEditRequestById(req.params.id) : null;
            if (!reqItem) {
                return res.status(404).json({ success: false, message: 'Edit request not found' });
            }
            return res.json({ success: true, data: reqItem });
        }

        const editRequest = await ProjectEditRequest.findById(req.params.id)
            .populate('projectId')
            .populate('requestedBy', 'name email role')
            .populate('reviewedBy', 'name email role');

        if (!editRequest) {
            return res.status(404).json({ success: false, message: 'Edit request not found' });
        }

        if (req.user.role === 'ENGINEER' && String(editRequest.requestedBy?._id) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({
            success: true,
            data: editRequest
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve edit request and apply changes to MongoDB Project document
// @route   PUT /api/project-edit-requests/:id/approve
// @access  Private (Admin only)
exports.approveEditRequest = async (req, res, next) => {
    try {
        const { adminComment } = req.body;
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const result = localStore.approveEditRequest ? localStore.approveEditRequest(req.params.id, adminComment, req.user) : null;
            if (!result) {
                return res.status(404).json({ success: false, message: 'Edit request not found' });
            }
            return res.json({
                success: true,
                message: 'Edit request approved and changes successfully applied to project',
                data: result
            });
        }

        const editRequest = await ProjectEditRequest.findById(req.params.id);
        if (!editRequest) {
            return res.status(404).json({ success: false, message: 'Edit request not found' });
        }

        if (editRequest.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `This edit request is already ${editRequest.status}`
            });
        }

        const project = await Project.findById(editRequest.projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Underlying project no longer exists'
            });
        }

        // Apply only permitted changes to the project
        const changes = editRequest.requestedChanges || {};
        for (const [key, value] of Object.entries(changes)) {
            if (ALLOWED_EDIT_FIELDS.includes(key) && value !== undefined) {
                project[key] = value;
            }
        }

        // If currentProgress changed to 100 or above, adjust status if appropriate
        if (changes.currentProgress !== undefined) {
            const prog = Number(changes.currentProgress);
            if (prog >= 100 && !changes.status) {
                project.status = 'Completed';
            }
        }

        await project.save();

        // Update request audit record
        editRequest.status = 'Approved';
        editRequest.reviewedBy = req.user._id;
        editRequest.reviewedAt = new Date();
        if (adminComment !== undefined) {
            editRequest.adminComment = adminComment.trim();
        }
        await editRequest.save();

        res.json({
            success: true,
            message: 'Project edit request approved and project document successfully updated in database',
            data: {
                editRequest,
                project
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject edit request without modifying project
// @route   PUT /api/project-edit-requests/:id/reject
// @access  Private (Admin only)
exports.rejectEditRequest = async (req, res, next) => {
    try {
        const { adminComment, adminResponse } = req.body;
        const comment = (adminComment !== undefined ? adminComment : adminResponse) || '';
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const result = localStore.rejectEditRequest ? localStore.rejectEditRequest(req.params.id, comment, req.user) : null;
            if (!result) {
                return res.status(404).json({ success: false, message: 'Edit request not found' });
            }
            return res.json({
                success: true,
                message: 'Edit request rejected. The project remains unmodified.',
                data: result
            });
        }

        const editRequest = await ProjectEditRequest.findById(req.params.id);
        if (!editRequest) {
            return res.status(404).json({ success: false, message: 'Edit request not found' });
        }

        if (editRequest.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `This edit request is already ${editRequest.status}`
            });
        }

        editRequest.status = 'Rejected';
        editRequest.adminComment = comment.trim();
        editRequest.reviewedBy = req.user._id;
        editRequest.reviewedAt = new Date();
        await editRequest.save();

        res.json({
            success: true,
            message: 'Project edit request rejected. Project has not been modified.',
            data: editRequest
        });
    } catch (error) {
        next(error);
    }
};
