const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectDeletionRequest = require('../models/ProjectDeletionRequest');
const ProgressUpdate = require('../models/ProgressUpdate');
const ProjectCompletion = require('../models/ProjectCompletion');
const localStore = require('../utils/localStore');

// @desc    Submit a project deletion request (Engineer / Admin)
// @route   POST /api/projects/:id/deletion-request
// @access  Private (Engineer / Admin)
exports.createDeletionRequest = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const projectId = req.params.id;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: 'A reason for project deletion is required' });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const project = localStore.getProjectById(projectId);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Check if already pending
            const existingRequests = localStore.getDeletionRequests();
            const hasPending = existingRequests.some(
                r => String(r.projectId) === String(project._id || project.projectId) && r.status === 'Pending'
            );
            if (hasPending) {
                return res.status(400).json({
                    success: false,
                    message: 'A deletion request for this project is already pending administrator review'
                });
            }

            const newReq = localStore.createDeletionRequest({
                projectId: project._id || project.projectId,
                projectName: project.projectName,
                requestedBy: req.user,
                requestedByRole: req.user.role,
                reason: reason.trim()
            });

            return res.status(201).json({
                success: true,
                message: 'Project deletion request submitted successfully for Admin review',
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
                    message: 'Access denied: You are only authorized to request deletion for your assigned projects'
                });
            }
        }

        // Check if there is already a pending request
        const existingPending = await ProjectDeletionRequest.findOne({
            projectId: project._id,
            status: 'Pending'
        });

        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: 'A deletion request for this project is already pending administrator review'
            });
        }

        const deletionRequest = await ProjectDeletionRequest.create({
            projectId: project._id,
            projectName: project.projectName,
            requestedBy: req.user._id,
            requestedByRole: req.user.role,
            reason: reason.trim()
        });

        res.status(201).json({
            success: true,
            message: 'Project deletion request submitted successfully for Admin review',
            data: deletionRequest
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all project deletion requests
// @route   GET /api/deletion-requests
// @access  Private (Admin sees all, Engineer sees their own)
exports.getDeletionRequests = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const requests = localStore.getDeletionRequests(req.user);
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

        const requests = await ProjectDeletionRequest.find(query)
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

// @desc    Approve deletion request and delete project
// @route   PUT /api/deletion-requests/:id/approve
// @access  Private (Admin only)
exports.approveDeletionRequest = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const result = localStore.approveDeletionRequest(req.params.id, req.user);
            if (!result) {
                return res.status(404).json({ success: false, message: 'Deletion request not found' });
            }
            return res.json({
                success: true,
                message: 'Deletion request approved and project removed from active list',
                data: result
            });
        }

        const deletionRequest = await ProjectDeletionRequest.findById(req.params.id);
        if (!deletionRequest) {
            return res.status(404).json({ success: false, message: 'Deletion request not found' });
        }

        if (deletionRequest.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `This request is already ${deletionRequest.status}`
            });
        }

        // Delete the project and associated updates/completions
        await Project.findByIdAndDelete(deletionRequest.projectId);
        await ProgressUpdate.deleteMany({ projectId: deletionRequest.projectId });
        await ProjectCompletion.deleteMany({ projectId: deletionRequest.projectId });

        // Update deletion request record to Approved
        deletionRequest.status = 'Approved';
        deletionRequest.reviewedBy = req.user._id;
        deletionRequest.reviewedAt = new Date();
        await deletionRequest.save();

        res.json({
            success: true,
            message: 'Project deletion request approved and project successfully deleted',
            data: deletionRequest
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject deletion request without deleting project
// @route   PUT /api/deletion-requests/:id/reject
// @access  Private (Admin only)
exports.rejectDeletionRequest = async (req, res, next) => {
    try {
        const { adminResponse } = req.body;
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const result = localStore.rejectDeletionRequest(req.params.id, adminResponse, req.user);
            if (!result) {
                return res.status(404).json({ success: false, message: 'Deletion request not found' });
            }
            return res.json({
                success: true,
                message: 'Deletion request rejected. The project remains active.',
                data: result
            });
        }

        const deletionRequest = await ProjectDeletionRequest.findById(req.params.id);
        if (!deletionRequest) {
            return res.status(404).json({ success: false, message: 'Deletion request not found' });
        }

        if (deletionRequest.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `This request is already ${deletionRequest.status}`
            });
        }

        deletionRequest.status = 'Rejected';
        deletionRequest.adminResponse = adminResponse || '';
        deletionRequest.reviewedBy = req.user._id;
        deletionRequest.reviewedAt = new Date();
        await deletionRequest.save();

        res.json({
            success: true,
            message: 'Deletion request rejected. Project has been retained.',
            data: deletionRequest
        });
    } catch (error) {
        next(error);
    }
};
