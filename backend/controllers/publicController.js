const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProgressUpdate = require('../models/ProgressUpdate');
const localStore = require('../utils/localStore');

// Helper to normalize status into clear labels: Not Started, In Progress, Delayed, Completed
const normalizeStatus = (status, progress = 0) => {
    const raw = String(status || '').toUpperCase();
    if (raw === 'COMPLETED' || Number(progress) >= 100) return 'Completed';
    if (raw === 'DELAYED' || raw === 'CRITICAL') return 'Delayed';
    if (raw === 'NOT_STARTED' || raw === 'PLANNED' || raw === 'PLANNING' || Number(progress) === 0) return 'Not Started';
    if (raw === 'IN_PROGRESS' || raw === 'ON_TRACK' || raw === 'ONGOING') return 'In Progress';
    return Number(progress) > 0 ? 'In Progress' : 'Not Started';
};

// Utility helper to sanitize public project document
const formatPublicProject = (proj, timelineUpdates = []) => {
    const p = proj.toObject ? proj.toObject() : proj;
    const currentProgress = Number(p.currentProgress !== undefined ? p.currentProgress : 0);
    const statusLabel = normalizeStatus(p.status, currentProgress);

    // Collect available photos
    const photoList = [];
    if (p.latestProgressPhoto) photoList.push(p.latestProgressPhoto);
    if (p.latestProgressUpdate && p.latestProgressUpdate.photoUrl && !photoList.includes(p.latestProgressUpdate.photoUrl)) {
        photoList.push(p.latestProgressUpdate.photoUrl);
    }
    if (p.completion) {
        const compImg = p.completion.completionPhoto || p.completion.completionImage;
        if (compImg && !photoList.includes(compImg)) {
            photoList.push(compImg);
        }
    }
    if (Array.isArray(p.photos)) {
        p.photos.forEach(ph => {
            if (ph && !photoList.includes(ph)) photoList.push(ph);
        });
    }
    if (Array.isArray(timelineUpdates)) {
        timelineUpdates.forEach(u => {
            if (u.photoUrl && !photoList.includes(u.photoUrl)) photoList.push(u.photoUrl);
        });
    }

    // Format completion details if present
    let completionData = null;
    if (p.completion && (p.completion.completionPercentage !== undefined || p.completion.completionImage || p.completion.completionPhoto || p.completion.completionDate)) {
        completionData = {
            completionPercentage: p.completion.completionPercentage ?? (currentProgress >= 100 ? 100 : null),
            completionDate: p.completion.completionDate || null,
            completionDescription: p.completion.completionDescription || '',
            completionImage: p.completion.completionImage || p.completion.completionPhoto || '',
            completionPhoto: p.completion.completionPhoto || p.completion.completionImage || '',
            contractorRemarks: p.completion.contractorRemarks || p.completion.remarks || ''
        };
    }

    const showFinancial = p.showFinancialData !== false;
    const showContractor = p.showContractor !== false;

    // Contractor display name
    let contractorName = null;
    if (showContractor) {
        if (typeof p.contractor === 'object' && p.contractor) {
            contractorName = p.contractor.name || 'Assigned Contractor';
        } else {
            contractorName = p.contractor || 'Assigned Contractor';
        }
    } else {
        contractorName = 'Contractor Undisclosed';
    }

    const result = {
        _id: p._id,
        id: p.projectId || String(p._id),
        projectId: p.projectId,
        projectName: p.projectName,
        village: p.village,
        district: p.district,
        state: p.state || 'Tamil Nadu',
        location: [p.village, p.district, p.state].filter(Boolean).join(', '),
        roadLength: p.roadLength,
        roadDetails: p.roadLength ? `${p.roadLength} km (${p.publicDescription || p.description || 'Rural connectivity corridor'})` : (p.publicDescription || p.description || 'Rural connectivity corridor'),
        description: p.publicDescription || p.description || '',
        publicDescription: p.publicDescription || p.description || '',
        startDate: p.startDate,
        expectedCompletion: p.expectedCompletion,
        currentProgress: currentProgress,
        progressPercent: currentProgress,
        status: statusLabel,
        rawStatus: p.status,
        showFinancialData: showFinancial,
        showContractor: showContractor,
        contractor: contractorName,
        latestProgressPhoto: p.latestProgressPhoto || (p.latestProgressUpdate && p.latestProgressUpdate.photoUrl) || '',
        latestProgressRemarks: (p.latestProgressUpdate && (p.latestProgressUpdate.workDescription || p.latestProgressUpdate.remarks)) || '',
        latestProgressUpdate: p.latestProgressUpdate || null,
        completion: completionData,
        photos: photoList,
        timeline: timelineUpdates.length > 0 ? timelineUpdates : (p.timeline || []),
        latitude: p.latitude !== undefined && p.latitude !== null ? Number(p.latitude) : (p.coordinates?.lat !== undefined && p.coordinates?.lat !== null ? Number(p.coordinates.lat) : null),
        longitude: p.longitude !== undefined && p.longitude !== null ? Number(p.longitude) : (p.coordinates?.lng !== undefined && p.coordinates?.lng !== null ? Number(p.coordinates.lng) : null),
        coordinates: (p.latitude != null && p.longitude != null) || (p.coordinates?.lat != null && p.coordinates?.lng != null)
            ? {
                lat: Number(p.latitude || p.coordinates?.lat),
                lng: Number(p.longitude || p.coordinates?.lng),
                path: Array.isArray(p.coordinates?.path) ? p.coordinates.path : []
            }
            : null,
        isGeotagged: Boolean((p.latitude != null && p.longitude != null) || (p.coordinates && p.coordinates.lat != null && p.coordinates.lng != null))
    };

    if (showFinancial) {
        const allocated = Number(p.allocatedBudget || 0);
        const spent = Number(p.amountSpent || 0);
        result.allocatedBudget = allocated;
        result.amountSpent = spent;
        result.amountUtilized = spent; // alias for clarity
        result.plannedBudget = allocated; // alias
        result.remainingBudget = Math.max(0, allocated - spent);
        result.fundUtilization = allocated > 0 ? parseFloat(((spent / allocated) * 100).toFixed(1)) : 0;
    } else {
        result.allocatedBudget = null;
        result.amountSpent = null;
        result.amountUtilized = null;
        result.plannedBudget = null;
        result.remainingBudget = null;
        result.fundUtilization = null;
    }

    return result;
};

// @desc    Get all public projects (fetches all projects created and listed by Admin in MongoDB)
// @route   GET /api/public/projects
// @access  Public
exports.getPublicProjects = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState === 1) {
            // Fetch all admin projects from MongoDB Atlas
            const projects = await Project.find({}).sort({ createdAt: -1 });

            // Fetch latest progress updates for all projects to include recent photos & remarks
            const projectIds = projects.map(p => p._id);
            const recentUpdates = await ProgressUpdate.find({ projectId: { $in: projectIds } })
                .sort({ createdAt: -1 })
                .select('projectId progress progressPercentage workDescription notes photoUrl remarks contractorName createdAt amountSpent isPublic');

            // Map updates by projectId
            const updateMap = new Map();
            recentUpdates.forEach(up => {
                const pId = String(up.projectId);
                if (!updateMap.has(pId)) updateMap.set(pId, []);
                updateMap.get(pId).push(up);
            });

            const formatted = projects.map(p => formatPublicProject(p, updateMap.get(String(p._id)) || []));

            return res.json({
                success: true,
                count: formatted.length,
                data: formatted
            });
        } else {
            const projects = localStore.getPublicProjects();
            return res.json({
                success: true,
                count: projects.length,
                data: projects.map(p => formatPublicProject(p))
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get single public project with full progress history and photographs
// @route   GET /api/public/projects/:id
// @access  Public
exports.getPublicProjectById = async (req, res, next) => {
    try {
        const idParam = req.params.id;

        if (mongoose.connection.readyState !== 1) {
            const project = localStore.getProjectById(idParam);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Public project record not found' });
            }
            return res.json({
                success: true,
                data: formatPublicProject(project)
            });
        }

        const project = await Project.findOne({
            $or: [
                { _id: idParam.match(/^[0-9a-fA-F]{24}$/) ? idParam : null },
                { projectId: idParam }
            ]
        });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Public project record not found' });
        }

        // Fetch all progress updates for full progress history
        const updates = await ProgressUpdate.find({ projectId: project._id })
            .sort({ createdAt: -1 })
            .select('progress progressPercentage workDescription notes photoUrl remarks contractorName createdAt amountSpent isPublic');

        const formatted = formatPublicProject(project, updates);

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search and filter public projects
// @route   GET /api/public/projects/search
// @access  Public
exports.searchPublicProjects = async (req, res, next) => {
    try {
        const { query, village, district, state, status, minProgress, maxProgress } = req.query;

        let filter = {};

        if (query) {
            const regex = new RegExp(query, 'i');
            filter.$or = [
                { projectName: regex },
                { village: regex },
                { district: regex },
                { projectId: regex }
            ];
        }

        if (village && village !== 'All') {
            filter.village = new RegExp(village, 'i');
        }

        if (district && district !== 'All') {
            filter.district = new RegExp(district, 'i');
        }

        if (state && state !== 'All') {
            filter.state = new RegExp(state, 'i');
        }

        if (status && status !== 'All') {
            const statusUpper = status.toUpperCase();
            if (statusUpper === 'COMPLETED') {
                filter.$or = [{ status: 'COMPLETED' }, { status: 'Completed' }, { currentProgress: { $gte: 100 } }];
            } else if (statusUpper === 'DELAYED') {
                filter.$or = [{ status: 'DELAYED' }, { status: 'Delayed' }, { status: 'CRITICAL' }, { status: 'Critical' }];
            } else if (statusUpper === 'NOT STARTED' || statusUpper === 'NOT_STARTED') {
                filter.$or = [{ status: 'NOT_STARTED' }, { status: 'Planned' }, { status: 'Planning' }, { currentProgress: 0 }];
            } else if (statusUpper === 'IN PROGRESS' || statusUpper === 'IN_PROGRESS') {
                filter.$or = [{ status: 'IN_PROGRESS' }, { status: 'Ongoing' }, { status: 'ON_TRACK' }, { status: 'In Progress' }];
            } else {
                filter.status = status;
            }
        }

        if (minProgress !== undefined || maxProgress !== undefined) {
            filter.currentProgress = {};
            if (minProgress !== undefined) filter.currentProgress.$gte = Number(minProgress);
            if (maxProgress !== undefined) filter.currentProgress.$lte = Number(maxProgress);
        }

        if (mongoose.connection.readyState === 1) {
            const projects = await Project.find(filter).sort({ createdAt: -1 });
            const formatted = projects.map(p => formatPublicProject(p));

            res.json({
                success: true,
                count: formatted.length,
                data: formatted
            });
        } else {
            const all = localStore.getPublicProjects().map(p => formatPublicProject(p));
            const filtered = all.filter(p => {
                if (query && !(`${p.projectName} ${p.village} ${p.district} ${p.projectId}`.toLowerCase().includes(query.toLowerCase()))) return false;
                if (village && village !== 'All' && !p.village.toLowerCase().includes(village.toLowerCase())) return false;
                if (district && district !== 'All' && !p.district.toLowerCase().includes(district.toLowerCase())) return false;
                if (status && status !== 'All' && p.status !== status) return false;
                return true;
            });

            res.json({
                success: true,
                count: filtered.length,
                data: filtered
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get overall public landing page & dashboard statistics
// @route   GET /api/public/stats
// @access  Public
exports.getPublicStats = async (req, res, next) => {
    try {
        let publicProjects = [];
        if (mongoose.connection.readyState === 1) {
            publicProjects = await Project.find({});
        } else {
            publicProjects = localStore.getPublicProjects();
        }

        const formatted = publicProjects.map(p => formatPublicProject(p));
        const totalPublicProjects = formatted.length;
        const completedProjects = formatted.filter(p => p.status === 'Completed').length;
        const underConstructionProjects = formatted.filter(p => p.status === 'In Progress').length;
        const delayedProjects = formatted.filter(p => p.status === 'Delayed').length;
        const notStartedProjects = formatted.filter(p => p.status === 'Not Started').length;

        const totalProgressSum = formatted.reduce((acc, p) => acc + (p.currentProgress || 0), 0);
        const avgProgress = totalPublicProjects > 0 ? parseFloat((totalProgressSum / totalPublicProjects).toFixed(1)) : 0;

        const totalPublicBudget = formatted.reduce((acc, p) => acc + (p.allocatedBudget || 0), 0);
        const totalPublicAmountSpent = formatted.reduce((acc, p) => acc + (p.amountSpent || 0), 0);
        const overallUtilization = totalPublicBudget > 0 ? parseFloat(((totalPublicAmountSpent / totalPublicBudget) * 100).toFixed(1)) : 0;

        const statusDistribution = [
            { name: 'Not Started', count: notStartedProjects },
            { name: 'In Progress', count: underConstructionProjects },
            { name: 'Delayed', count: delayedProjects },
            { name: 'Completed', count: completedProjects }
        ];

        res.json({
            success: true,
            data: {
                totalPublicProjects,
                underConstructionProjects,
                completedProjects,
                delayedProjects,
                notStartedProjects,
                avgProgress,
                totalPublicBudget,
                totalPublicAmountSpent,
                overallUtilization,
                statusDistribution
            }
        });
    } catch (error) {
        next(error);
    }
};
