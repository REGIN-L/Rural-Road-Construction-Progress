const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProgressUpdate = require('../models/ProgressUpdate');
const ProjectCompletion = require('../models/ProjectCompletion');
const ProjectDeletionRequest = require('../models/ProjectDeletionRequest');
const { calculateProjectStatus } = require('../utils/statusCalculator');
const localStore = require('../utils/localStore');

// @desc    Get all projects (Viewable across all portals: Admin, Engineer, Contractor)
// @route   GET /api/projects
// @access  Private (Admin / Engineer / Contractor)
exports.getProjects = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState === 1) {
            // All portals (Admin, Engineer, Contractor) view all projects in the system
            const projects = await Project.find({})
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

        const project = await Project.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null },
                { projectId: req.params.id }
            ]
        })
            .populate('assignedEngineer', 'name email role')
            .populate('createdBy', 'name email role')
            .populate('contractorId', 'name email role');

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Projects are viewable across all authenticated portals (Admin, Engineer, Contractor)
        const updates = await ProgressUpdate.find({ projectId: project._id })
            .populate('updatedBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                ...project.toObject(),
                updates,
                timeline: updates // alias for frontend AdminProjectDetails
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
            assignedEngineer,
            latitude,
            longitude,
            coordinates,
            path
        } = req.body;

        let effectiveProjectId = projectId;
        const isMongo = mongoose.connection.readyState === 1;

        if (!effectiveProjectId || !String(effectiveProjectId).trim()) {
            const count = isMongo ? await Project.countDocuments() : (localStore.data.projects || []).length;
            effectiveProjectId = `RC-${String(count + 1).padStart(3, '0')}`;
        }

        // Validation
        if (!effectiveProjectId || !projectName || !village || !district || !roadLength || !allocatedBudget || !startDate || !expectedCompletion) {
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

        // Parse and validate GPS Coordinates
        let validLat = null;
        let validLng = null;
        let validPath = [];

        const rawLat = latitude !== undefined && latitude !== null && latitude !== '' 
            ? Number(latitude) 
            : (coordinates?.lat !== undefined && coordinates?.lat !== null && coordinates?.lat !== '' ? Number(coordinates.lat) : null);
        const rawLng = longitude !== undefined && longitude !== null && longitude !== '' 
            ? Number(longitude) 
            : (coordinates?.lng !== undefined && coordinates?.lng !== null && coordinates?.lng !== '' ? Number(coordinates.lng) : null);

        if (rawLat !== null && !isNaN(rawLat) && rawLng !== null && !isNaN(rawLng)) {
            if (rawLat < -90 || rawLat > 90 || rawLng < -180 || rawLng > 180) {
                return res.status(400).json({ success: false, message: 'Invalid GPS coordinates: Latitude must be between -90 and 90, Longitude between -180 and 180.' });
            }
            validLat = Number(rawLat.toFixed(6));
            validLng = Number(rawLng.toFixed(6));
        }

        if (Array.isArray(coordinates?.path)) {
            validPath = coordinates.path.filter(p => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));
        } else if (Array.isArray(path)) {
            validPath = path.filter(p => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));
        }

        const isGeotagged = validLat !== null && validLng !== null;
        const coordinatesObj = isGeotagged ? { lat: validLat, lng: validLng, path: validPath } : { lat: null, lng: null, path: [] };

        const statusMap = {
            'In Progress': 'Ongoing',
            'IN_PROGRESS': 'Ongoing',
            'Ongoing': 'Ongoing',
            'Not Started': 'Planned',
            'NOT_STARTED': 'Planned',
            'Planned': 'Planned',
            'On Track': 'Ongoing',
            'ON_TRACK': 'Ongoing',
            'Critical': 'Delayed',
            'CRITICAL': 'Delayed',
            'Delayed': 'Delayed',
            'DELAYED': 'Delayed',
            'Completed': 'Completed',
            'COMPLETED': 'Completed'
        };

        if (!isMongo) {
            let uniqueProjectId = effectiveProjectId;
            let existingProject = localStore.getProjectById(uniqueProjectId);
            if (existingProject) {
                let suffix = 1;
                while (existingProject) {
                    uniqueProjectId = `${effectiveProjectId}-${suffix++}`;
                    existingProject = localStore.getProjectById(uniqueProjectId);
                }
            }

            const project = localStore.createProject({
                ...req.body,
                projectId: uniqueProjectId,
                status: statusMap[status] || status,
                latitude: validLat,
                longitude: validLng,
                coordinates: coordinatesObj,
                isGeotagged
            }, req.user);

            return res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: project
            });
        }

        let uniqueProjectId = effectiveProjectId;
        let existingProject = await Project.findOne({ projectId: uniqueProjectId });
        if (existingProject) {
            let suffix = 1;
            while (existingProject) {
                uniqueProjectId = `${effectiveProjectId}-${suffix++}`;
                existingProject = await Project.findOne({ projectId: uniqueProjectId });
            }
        }

        const initialProgress = Number(currentProgress) || 0;
        const initialStatus = statusMap[status] || (initialProgress >= 100 ? 'Completed' : (initialProgress > 0 ? 'Ongoing' : 'Planned'));

        // Assign engineer: if engineer creates project, default assignedEngineer to themselves if not specified
        const finalAssignedEngineer = assignedEngineer || (req.user.role === 'ENGINEER' ? req.user._id : null);

        const project = await Project.create({
            projectId: uniqueProjectId,
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
            assignedEngineer: finalAssignedEngineer,
            latitude: validLat,
            longitude: validLng,
            coordinates: coordinatesObj,
            isGeotagged
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

// @desc    Update project (ADMIN ONLY — Engineers MUST use edit request)
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
exports.updateProject = async (req, res, next) => {
    try {
        // Strict security enforcement on backend
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only administrators can directly edit projects. Engineers must submit an edit request.'
            });
        }

        const isMongo = mongoose.connection.readyState === 1;

        const updateData = { ...req.body };

        // Normalize status if provided
        if (updateData.status) {
            const statusMap = {
                'In Progress': 'Ongoing',
                'IN_PROGRESS': 'Ongoing',
                'Ongoing': 'Ongoing',
                'Not Started': 'Planned',
                'NOT_STARTED': 'Planned',
                'Planned': 'Planned',
                'On Track': 'Ongoing',
                'ON_TRACK': 'Ongoing',
                'Critical': 'Delayed',
                'CRITICAL': 'Delayed',
                'Delayed': 'Delayed',
                'DELAYED': 'Delayed',
                'Completed': 'Completed',
                'COMPLETED': 'Completed'
            };
            updateData.status = statusMap[updateData.status] || updateData.status;
        }

        // Parse and validate GPS coordinates if supplied
        if (updateData.latitude !== undefined || updateData.longitude !== undefined || updateData.coordinates !== undefined) {
            const rawLat = updateData.latitude !== undefined && updateData.latitude !== null && updateData.latitude !== '' 
                ? Number(updateData.latitude) 
                : (updateData.coordinates?.lat !== undefined && updateData.coordinates?.lat !== null && updateData.coordinates?.lat !== '' ? Number(updateData.coordinates.lat) : null);
            const rawLng = updateData.longitude !== undefined && updateData.longitude !== null && updateData.longitude !== '' 
                ? Number(updateData.longitude) 
                : (updateData.coordinates?.lng !== undefined && updateData.coordinates?.lng !== null && updateData.coordinates?.lng !== '' ? Number(updateData.coordinates.lng) : null);

            if (rawLat !== null && !isNaN(rawLat) && rawLng !== null && !isNaN(rawLng)) {
                if (rawLat < -90 || rawLat > 90 || rawLng < -180 || rawLng > 180) {
                    return res.status(400).json({ success: false, message: 'Invalid GPS coordinates: Latitude must be between -90 and 90, Longitude between -180 and 180.' });
                }
                const validLat = Number(rawLat.toFixed(6));
                const validLng = Number(rawLng.toFixed(6));
                const validPath = Array.isArray(updateData.coordinates?.path)
                    ? updateData.coordinates.path.filter(p => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]))
                    : (Array.isArray(updateData.path) ? updateData.path.filter(p => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) : []);

                updateData.latitude = validLat;
                updateData.longitude = validLng;
                updateData.coordinates = { lat: validLat, lng: validLng, path: validPath };
                updateData.isGeotagged = true;
            } else if (updateData.latitude === null || updateData.longitude === null) {
                updateData.latitude = null;
                updateData.longitude = null;
                updateData.coordinates = { lat: null, lng: null, path: [] };
                updateData.isGeotagged = false;
            }
        }

        if (!isMongo) {
            const project = localStore.getProjectById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            Object.assign(project, updateData);
            localStore.save();
            return res.json({
                success: true,
                message: 'Project updated successfully',
                data: project
            });
        }

        let project = await Project.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null },
                { projectId: req.params.id }
            ]
        });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        project = await Project.findByIdAndUpdate(project._id, updateData, {
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

        const project = await Project.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null },
                { projectId: req.params.id }
            ]
        });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        await Project.findByIdAndDelete(project._id);
        await ProgressUpdate.deleteMany({ projectId: project._id });
        await ProjectCompletion.deleteMany({ projectId: project._id });
        await ProjectDeletionRequest.deleteMany({ projectId: project._id });

        res.json({
            success: true,
            message: 'Project and all related data deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Helper to verify if contractor can update project
const isContractorAssigned = (project, user) => {
    // All projects created by admin and engineer can receive progress updates from contractors
    return true;
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
            completionPhoto,
            contractorRemarks,
            remarks
        } = req.body;

        const photo = (completionPhoto || completionImage || '').trim();
        const finalRemarks = (contractorRemarks || remarks || '').trim();
        const desc = (completionDescription || '').trim();

        // Validation: Completion is strictly allowed only at exactly 100%
        const perc = completionPercentage !== undefined && completionPercentage !== null && completionPercentage !== ''
            ? Number(completionPercentage)
            : 100;

        if (isNaN(perc) || perc !== 100) {
            return res.status(400).json({
                success: false,
                message: 'Project completion can only be submitted when progress reaches 100%. Marking completed at less than 100% is not allowed.'
            });
        }

        if (!desc) {
            return res.status(400).json({
                success: false,
                message: 'Completion description is required.'
            });
        }

        if (!photo) {
            return res.status(400).json({
                success: false,
                message: 'A completion photo is required when marking a project completed.'
            });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const project = localStore.getProjectById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Contractor authorization check
            if (req.user.role === 'CONTRACTOR') {
                if (!isContractorAssigned(project, req.user)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied: You can only submit completion for projects assigned to you.'
                    });
                }
            }

            const result = localStore.submitCompletion(req.params.id, {
                completionPercentage: 100,
                completionDate: completionDate || new Date().toISOString(),
                completionDescription: desc,
                completionImage: photo,
                completionPhoto: photo,
                contractorRemarks: finalRemarks
            }, req.user);

            return res.status(201).json({
                success: true,
                message: 'Project marked as 100% Completed with completion evidence.',
                data: result
            });
        }

        const project = await Project.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null },
                { projectId: req.params.id }
            ]
        });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Contractor authorization check
        if (req.user.role === 'CONTRACTOR') {
            if (!isContractorAssigned(project, req.user)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only submit completion for projects assigned to you.'
                });
            }
        }

        const compDate = completionDate ? new Date(completionDate) : new Date();

        const completionRecord = await ProjectCompletion.create({
            projectId: project._id,
            contractorId: req.user._id,
            completionPercentage: 100,
            completionDate: compDate,
            completionDescription: desc,
            completionImage: photo,
            completionPhoto: photo,
            contractorRemarks: finalRemarks,
            submittedAt: new Date()
        });

        // Also add historical ProgressUpdate record for 100% completion
        await ProgressUpdate.create({
            projectId: project._id,
            progress: 100,
            progressPercentage: 100,
            workDescription: `Project Completed: ${desc}`,
            notes: `Project Completed: ${desc}`,
            photoUrl: photo,
            remarks: finalRemarks,
            amountSpent: project.amountSpent,
            updatedBy: req.user._id,
            contractorId: req.user._id,
            contractorName: req.user.name || project.contractor,
            isPublic: true
        });

        // Update Project document as single source of truth
        project.completion = {
            completionPercentage: 100,
            completionDate: compDate,
            completionDescription: desc,
            completionImage: photo,
            completionPhoto: photo,
            contractorRemarks: finalRemarks,
            submittedBy: req.user._id,
            submittedAt: new Date()
        };

        project.status = 'Completed';
        project.currentProgress = 100;
        project.latestProgressPhoto = photo;
        project.latestProgressUpdate = {
            progress: 100,
            workDescription: desc,
            photoUrl: photo,
            updatedAt: new Date()
        };

        await project.save();

        res.status(201).json({
            success: true,
            message: 'Project marked as 100% Completed with completion evidence.',
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
// @access  Private (Admin / Assigned Engineer / Assigned Contractor)
exports.addProgressUpdate = async (req, res, next) => {
    try {
        const rawProgress = req.body.progressPercentage !== undefined
            ? req.body.progressPercentage
            : req.body.progress;
        const workDesc = (req.body.workDescription || req.body.notes || '').trim();
        const photo = (req.body.photoUrl || req.body.photo || req.body.progressPhoto || '').trim();
        const remarks = (req.body.remarks || '').trim();
        const { amountSpent, isPublic, status } = req.body;

        // Validation
        if (rawProgress === undefined || rawProgress === null || rawProgress === '') {
            return res.status(400).json({ success: false, message: 'Progress percentage is required' });
        }

        const newProgress = Number(rawProgress);
        if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
            return res.status(400).json({ success: false, message: 'Progress percentage must be a number between 0 and 100' });
        }

        if (!workDesc) {
            return res.status(400).json({ success: false, message: 'Work description is required' });
        }

        const isMongo = mongoose.connection.readyState === 1;

        if (!isMongo) {
            const project = localStore.getProjectById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Contractor authorization check
            if (req.user.role === 'CONTRACTOR') {
                if (!isContractorAssigned(project, req.user)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied: You can only upload progress for projects assigned to you.'
                    });
                }
            }

            const result = localStore.addProgressUpdate(req.params.id, {
                progress: newProgress,
                progressPercentage: newProgress,
                workDescription: workDesc,
                notes: workDesc,
                photoUrl: photo,
                remarks,
                amountSpent: amountSpent !== undefined ? Number(amountSpent) : project.amountSpent,
                isPublic: isPublic !== undefined ? Boolean(isPublic) : true
            }, req.user);

            return res.status(201).json({
                success: true,
                message: 'Progress update recorded successfully',
                data: result.update,
                project: result.project
            });
        }

        const project = await Project.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null },
                { projectId: req.params.id }
            ]
        });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Contractor authorization check: Contractor can ONLY update their assigned projects
        if (req.user.role === 'CONTRACTOR') {
            if (!isContractorAssigned(project, req.user)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only upload progress for projects assigned to you.'
                });
            }
        }

        // Engineer authorization check
        if (req.user.role === 'ENGINEER') {
            const isAssigned = String(project.assignedEngineer) === String(req.user.id);
            const isCreator = String(project.createdBy) === String(req.user.id);
            if (!isAssigned && !isCreator) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You are not assigned to this project'
                });
            }
        }

        const newSpent = amountSpent !== undefined ? Number(amountSpent) : project.amountSpent;

        // Save Progress Update Document
        const update = await ProgressUpdate.create({
            projectId: project._id,
            progress: newProgress,
            progressPercentage: newProgress,
            workDescription: workDesc,
            notes: workDesc,
            photoUrl: photo,
            remarks,
            amountSpent: newSpent,
            updatedBy: req.user.id,
            contractorId: req.user.role === 'CONTRACTOR' ? req.user.id : (project.contractorId || null),
            contractorName: req.user.role === 'CONTRACTOR' ? req.user.name : (project.contractor || ''),
            isPublic: isPublic !== undefined ? Boolean(isPublic) : true
        });

        // Update single source of truth project document
        const computedStatus = status || (newProgress >= 100 ? 'Completed' : (newProgress > 0 ? (project.status === 'Delayed' ? 'Delayed' : 'Ongoing') : project.status));

        project.currentProgress = newProgress;
        project.amountSpent = newSpent;
        project.status = computedStatus;
        if (photo) {
            project.latestProgressPhoto = photo;
        }
        project.latestProgressUpdate = {
            progress: newProgress,
            workDescription: workDesc,
            photoUrl: photo,
            updatedAt: new Date()
        };

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
// @access  Private (Admin / Engineer / Contractor)
exports.getProgressUpdates = async (req, res, next) => {
    try {
        const isMongo = mongoose.connection.readyState === 1;
        if (!isMongo) {
            const updates = localStore.getProgressUpdates(req.params.id);
            return res.json({ success: true, count: updates.length, data: updates });
        }
        let targetId = req.params.id;
        if (!mongoose.isValidObjectId(req.params.id)) {
            const project = await Project.findOne({ projectId: req.params.id });
            if (project) targetId = project._id;
        }

        const updates = await ProgressUpdate.find({
            $or: [{ projectId: targetId }, { projectId: req.params.id }]
        })
            .populate('updatedBy', 'name email role')
            .populate('contractorId', 'name email role')
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
