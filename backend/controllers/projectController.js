const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProgressUpdate = require('../models/ProgressUpdate');
const ProjectCompletion = require('../models/ProjectCompletion');
const ProjectDeletionRequest = require('../models/ProjectDeletionRequest');
const { calculateProjectStatus } = require('../utils/statusCalculator');
const localStore = require('../utils/localStore');

// @desc    Get all projects (Admin sees all, Engineer sees assigned/created, Contractor sees assigned)
// @route   GET /api/projects
// @access  Private (Admin / Engineer / Contractor)
exports.getProjects = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState === 1) {
            let filter = {};
            if (req.user.role === 'ENGINEER') {
                filter = {
                    $or: [
                        { assignedEngineer: req.user.id },
                        { createdBy: req.user.id }
                    ]
                };
            } else if (req.user.role === 'CONTRACTOR') {
                filter = {
                    $or: [
                        { contractorId: req.user.id },
                        { contractor: new RegExp(`^${req.user.name}$`, 'i') }
                    ]
                };
            }

            const projects = await Project.find(filter)
                .populate('assignedEngineer', 'name email role')
                .populate('createdBy', 'name email role')
                .populate('contractorId', 'name email role')
                .sort({ createdAt: -1 });

            return res.json({
                success: true,
                count: projects.length,
                data: projects
            });
        } else {
            const projects = localStore.getAllProjects(req.user);
            return res.json({
                success: true,
                count: projects.length,
                data: projects
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private (Admin / Engineer / Contractor)
exports.getProjectById = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const project = localStore.getProjectById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            return res.json({
                success: true,
                data: {
                    ...project,
                    updates: []
                }
            });
        }

        const project = await Project.findById(req.params.id)
            .populate('assignedEngineer', 'name email role')
            .populate('createdBy', 'name email role')
            .populate('contractorId', 'name email role');

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Authorization checks
        if (req.user.role === 'ENGINEER') {
            const isAssigned = String(project.assignedEngineer?._id) === String(req.user.id);
            const isCreator = String(project.createdBy?._id) === String(req.user.id);
            if (!isAssigned && !isCreator) {
                return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this project' });
            }
        }

        if (req.user.role === 'CONTRACTOR') {
            const isAssignedContractor = String(project.contractorId?._id) === String(req.user.id) ||
                (project.contractor && project.contractor.toLowerCase() === req.user.name.toLowerCase());
            if (!isAssignedContractor) {
                return res.status(403).json({ success: false, message: 'Access denied: You are not the assigned contractor for this project' });
            }
        }

        const updates = await ProgressUpdate.find({ projectId: project._id })
            .populate('updatedBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                ...project.toObject(),
                updates
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new project (Admin or Engineer)
// @route   POST /api/projects
// @access  Private (Admin / Engineer)
exports.createProject = async (req, res, next) => {
    try {
        const {
            projectId,
            projectName,
            village,
            district,
            state,
            roadLength,
            allocatedBudget,
            amountSpent,
            startDate,
            expectedCompletion,
            currentProgress,
            contractor,
            contractorId,
            description,
            status,
            isPublic,
            showContractor,
            showFinancialData,
            publicDescription,
            assignedEngineer
        } = req.body;

        // Validation
        if (!projectId || !projectName || !village || !district || !roadLength || !allocatedBudget || !startDate || !expectedCompletion) {
            return res.status(400).json({ success: false, message: 'Please fill in all required project fields marked with *' });
        }

        if (Number(roadLength) <= 0) {
            return res.status(400).json({ success: false, message: 'Road length must be a positive number' });
        }

        if (Number(allocatedBudget) < 0) {
            return res.status(400).json({ success: false, message: 'Allocated budget cannot be negative' });
        }

        if (new Date(expectedCompletion) <= new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'Expected completion date must be after start date' });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const existingProject = localStore.getProjectById(projectId);
            if (existingProject) {
                return res.status(400).json({ success: false, message: `Project ID ${projectId} already exists` });
            }

            const project = localStore.createProject(req.body, req.user);
            return res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: project
            });
        }

        const existingProject = await Project.findOne({ projectId });
        if (existingProject) {
            return res.status(400).json({ success: false, message: `Project ID ${projectId} already exists` });
        }

        const initialProgress = Number(currentProgress) || 0;
        const initialStatus = status || (initialProgress >= 100 ? 'Completed' : (initialProgress > 0 ? 'Ongoing' : 'Planned'));

        // Assign engineer: if engineer creates project, default assignedEngineer to themselves if not specified
        const finalAssignedEngineer = assignedEngineer || (req.user.role === 'ENGINEER' ? req.user._id : null);

        const project = await Project.create({
            projectId,
            projectName,
            village,
            district,
            state: state || 'Tamil Nadu',
            roadLength: Number(roadLength),
            allocatedBudget: Number(allocatedBudget),
            amountSpent: Number(amountSpent) || 0,
            startDate,
            expectedCompletion,
            currentProgress: initialProgress,
            contractor: contractor || 'Unassigned Contractor',
            contractorId: contractorId || null,
            createdBy: req.user._id,
            creatorRole: req.user.role,
            description: description || '',
            status: initialStatus,
            isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
            showContractor: showContractor !== undefined ? Boolean(showContractor) : true,
            showFinancialData: showFinancialData !== undefined ? Boolean(showFinancialData) : true,
            publicDescription: publicDescription || description || '',
            assignedEngineer: finalAssignedEngineer
        });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin / Assigned Engineer)
exports.updateProject = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const project = localStore.getProjectById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            Object.assign(project, req.body);
            localStore.save();
            return res.json({
                success: true,
                message: 'Project updated successfully',
                data: project
            });
        }

        let project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (req.user.role === 'ENGINEER') {
            const isAssigned = String(project.assignedEngineer) === String(req.user.id);
            const isCreator = String(project.createdBy) === String(req.user.id);
            if (!isAssigned && !isCreator) {
                return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this project' });
            }
        }

        if (req.user.role === 'CONTRACTOR') {
            return res.status(403).json({ success: false, message: 'Contractors must submit progress updates through the completion/progress endpoint' });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('assignedEngineer', 'name email role');

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project (ADMIN ONLY — Engineers MUST use deletion request)
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res, next) => {
    try {
        // Strict security enforcement on backend
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only administrators can directly delete projects. Engineers must submit a deletion request.'
            });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const success = localStore.deleteProject(req.params.id);
            if (!success) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            return res.json({
                success: true,
                message: 'Project deleted successfully'
            });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        await Project.findByIdAndDelete(req.params.id);
        await ProgressUpdate.deleteMany({ projectId: req.params.id });
        await ProjectCompletion.deleteMany({ projectId: req.params.id });
        await ProjectDeletionRequest.deleteMany({ projectId: req.params.id });

        res.json({
            success: true,
            message: 'Project and all related data deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit contractor project completion evidence
// @route   POST /api/projects/:id/completion
// @access  Private (Assigned Contractor / Admin)
exports.submitCompletion = async (req, res, next) => {
    try {
        const {
            completionPercentage,
            completionDate,
            completionDescription,
            completionImage,
            contractorRemarks
        } = req.body;

        // Validation
        if (completionPercentage === undefined || completionPercentage === null || completionPercentage === '') {
            return res.status(400).json({ success: false, message: 'Completion percentage is required' });
        }

        const perc = Number(completionPercentage);
        if (isNaN(perc) || perc < 0 || perc > 100) {
            return res.status(400).json({ success: false, message: 'Completion percentage must be a number between 0 and 100' });
        }

        if (!completionDate) {
            return res.status(400).json({ success: false, message: 'Completion date is required' });
        }

        if (!completionDescription || !completionDescription.trim()) {
            return res.status(400).json({ success: false, message: 'Completion description is required' });
        }

        // 100% completion requires an image
        if (perc === 100 && (!completionImage || !completionImage.trim())) {
            return res.status(400).json({
                success: false,
                message: 'A real completion image is required when submitting 100% project completion'
            });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const project = localStore.getProjectById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Contractor check
            if (req.user.role === 'CONTRACTOR') {
                const isAssigned = String(project.contractorId) === String(req.user._id || req.user.id) ||
                    (project.contractor && project.contractor.toLowerCase() === req.user.name.toLowerCase());
                if (!isAssigned) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied: You are not authorized to submit completion for this project'
                    });
                }
            }

            const result = localStore.submitCompletion(req.params.id, {
                completionPercentage: perc,
                completionDate,
                completionDescription: completionDescription.trim(),
                completionImage: completionImage ? completionImage.trim() : '',
                contractorRemarks: contractorRemarks ? contractorRemarks.trim() : ''
            }, req.user);

            return res.status(201).json({
                success: true,
                message: perc >= 100 ? 'Project marked as 100% Completed with completion evidence.' : 'Completion progress recorded successfully.',
                data: result
            });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Authorization check
        if (req.user.role === 'CONTRACTOR') {
            const isAssigned = String(project.contractorId) === String(req.user._id) ||
                (project.contractor && project.contractor.toLowerCase() === req.user.name.toLowerCase());
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Only the assigned contractor can submit completion for this project'
                });
            }
        }

        const completionRecord = await ProjectCompletion.create({
            projectId: project._id,
            contractorId: req.user._id,
            completionPercentage: perc,
            completionDate,
            completionDescription: completionDescription.trim(),
            completionImage: completionImage ? completionImage.trim() : '',
            contractorRemarks: contractorRemarks ? contractorRemarks.trim() : '',
            submittedAt: new Date()
        });

        // Update Project document
        project.completion = {
            completionPercentage: perc,
            completionDate,
            completionDescription: completionDescription.trim(),
            completionImage: completionImage ? completionImage.trim() : '',
            contractorRemarks: contractorRemarks ? contractorRemarks.trim() : '',
            submittedBy: req.user._id,
            submittedAt: new Date()
        };

        if (perc >= 100) {
            project.status = 'Completed';
            project.currentProgress = 100;
        } else {
            project.currentProgress = perc;
        }

        await project.save();

        res.status(201).json({
            success: true,
            message: perc >= 100 ? 'Project marked as Completed with completion evidence.' : 'Completion progress recorded successfully.',
            data: {
                project,
                completion: completionRecord
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get project completion details
// @route   GET /api/projects/:id/completion
// @access  Private / Public
exports.getCompletion = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const completion = localStore.getCompletion(req.params.id);
            if (!completion) {
                return res.status(404).json({ success: false, message: 'No completion information found for this project' });
            }
            return res.json({ success: true, data: completion });
        }

        const project = await Project.findById(req.params.id).select('completion projectName projectId status');
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (!project.completion || !project.completion.completionPercentage) {
            const completionDoc = await ProjectCompletion.findOne({ projectId: project._id }).sort({ submittedAt: -1 });
            if (!completionDoc) {
                return res.status(404).json({ success: false, message: 'No completion record found for this project' });
            }
            return res.json({ success: true, data: completionDoc });
        }

        res.json({ success: true, data: project.completion });
    } catch (error) {
        next(error);
    }
};

// @desc    Add progress update to a project
// @route   POST /api/projects/:id/progress
// @access  Private (Admin / Assigned Engineer / Contractor)
exports.addProgressUpdate = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const { progress, notes, isPublic } = req.body;
            if (progress === undefined) {
                return res.status(400).json({ success: false, message: 'Progress percentage is required' });
            }
            const result = localStore.addProgressUpdate(req.params.id, { progress, notes, isPublic }, req.user);
            if (!result) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            return res.status(201).json({
                success: true,
                message: 'Progress update recorded successfully',
                data: result
            });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (req.user.role === 'ENGINEER') {
            const isAssigned = String(project.assignedEngineer) === String(req.user.id);
            const isCreator = String(project.createdBy) === String(req.user.id);
            if (!isAssigned && !isCreator) {
                return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this project' });
            }
        }

        const { progress, amountSpent, notes, isPublic, status } = req.body;

        if (progress === undefined || !notes) {
            return res.status(400).json({ success: false, message: 'Progress percentage and notes are required' });
        }

        const newProgress = Number(progress);
        const newSpent = amountSpent !== undefined ? Number(amountSpent) : project.amountSpent;

        // Save Progress Update Document
        const update = await ProgressUpdate.create({
            projectId: project._id,
            progress: newProgress,
            amountSpent: newSpent,
            notes,
            updatedBy: req.user.id,
            isPublic: Boolean(isPublic)
        });

        // Update parent project document and recalculate status
        const computedStatus = status || (newProgress >= 100 ? 'Completed' : (newProgress > 0 ? 'Ongoing' : 'Planned'));

        project.currentProgress = newProgress;
        project.amountSpent = newSpent;
        project.status = computedStatus;
        await project.save();

        res.status(201).json({
            success: true,
            message: 'Progress update recorded successfully',
            data: update,
            project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get progress updates for a project
// @route   GET /api/projects/:id/progress
// @access  Private (Admin / Engineer)
exports.getProgressUpdates = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;
        if (!isMongo) {
            return res.json({ success: true, count: 0, data: [] });
        }

        const updates = await ProgressUpdate.find({ projectId: req.params.id })
            .populate('updatedBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: updates.length,
            data: updates
        });
    } catch (error) {
        next(error);
    }
};
