const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProgressUpdate = require('../models/ProgressUpdate');
const localStore = require('../utils/localStore');

// Utility helper to sanitize public project document
const formatPublicProject = (proj) => {
    const p = proj.toObject ? proj.toObject() : proj;
    const result = {
        _id: p._id,
        projectId: p.projectId,
        projectName: p.projectName,
        village: p.village,
        district: p.district,
        state: p.state,
        roadLength: p.roadLength,
        currentProgress: p.currentProgress,
        status: p.status,
        startDate: p.startDate,
        expectedCompletion: p.expectedCompletion,
        publicDescription: p.publicDescription || p.description,
        showFinancialData: p.showFinancialData,
        showContractor: p.showContractor
    };

    if (p.showFinancialData) {
        result.allocatedBudget = p.allocatedBudget;
        result.amountSpent = p.amountSpent;
        result.remainingBudget = Math.max(0, p.allocatedBudget - p.amountSpent);
        result.fundUtilization = p.allocatedBudget > 0 ? parseFloat(((p.amountSpent / p.allocatedBudget) * 100).toFixed(1)) : 0;
    }

    if (p.showContractor) {
        result.contractor = p.contractor;
    }

    if (p.completion && (p.completion.completionPercentage !== undefined || p.completion.completionImage)) {
        result.completion = {
            completionPercentage: p.completion.completionPercentage,
            completionDate: p.completion.completionDate,
            completionDescription: p.completion.completionDescription,
            completionImage: p.completion.completionImage,
            contractorRemarks: p.completion.contractorRemarks
        };
    }

    return result;
};

// @desc    Get all public projects
// @route   GET /api/public/projects
// @access  Public
exports.getPublicProjects = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const projects = await Project.find({ isPublic: true }).sort({ createdAt: -1 });
            const formatted = projects.map(formatPublicProject);

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
                data: projects
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get single public project with public updates
// @route   GET /api/public/projects/:id
// @access  Public
exports.getPublicProjectById = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const project = localStore.getProjectById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Public project record not found' });
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
            $and: [
                { isPublic: true },
                { $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { projectId: req.params.id }] }
            ]
        });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Public project not found' });
        }

        // Fetch approved public progress updates
        const updates = await ProgressUpdate.find({ projectId: project._id, isPublic: true })
            .sort({ createdAt: -1 })
            .select('progress amountSpent notes createdAt');

        const formatted = formatPublicProject(project);
        formatted.timeline = updates;

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
        const { query, district, state, status, minProgress, maxProgress } = req.query;

        let filter = { isPublic: true };

        if (query) {
            const regex = new RegExp(query, 'i');
            filter.$or = [
                { projectName: regex },
                { village: regex },
                { district: regex },
                { projectId: regex }
            ];
        }

        if (district && district !== 'All') {
            filter.district = new RegExp(district, 'i');
        }

        if (state && state !== 'All') {
            filter.state = new RegExp(state, 'i');
        }

        if (status && status !== 'All') {
            filter.status = status;
        }

        if (minProgress !== undefined || maxProgress !== undefined) {
            filter.currentProgress = {};
            if (minProgress !== undefined) filter.currentProgress.$gte = Number(minProgress);
            if (maxProgress !== undefined) filter.currentProgress.$lte = Number(maxProgress);
        }

        const projects = await Project.find(filter).sort({ createdAt: -1 });
        const formatted = projects.map(formatPublicProject);

        res.json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get overall public landing page & dashboard statistics
// @route   GET /api/public/stats
// @access  Public
exports.getPublicStats = async (req, res, next) => {
    try {
        const publicProjects = await Project.find({ isPublic: true });

        const totalPublicProjects = publicProjects.length;
        const completedProjects = publicProjects.filter(p => p.status === 'COMPLETED').length;
        const underConstructionProjects = publicProjects.filter(p => p.status === 'ON_TRACK').length;
        const delayedProjects = publicProjects.filter(p => p.status === 'DELAYED' || p.status === 'CRITICAL').length;

        const totalProgressSum = publicProjects.reduce((acc, p) => acc + p.currentProgress, 0);
        const avgProgress = totalPublicProjects > 0 ? parseFloat((totalProgressSum / totalPublicProjects).toFixed(1)) : 0;

        const totalPublicBudget = publicProjects.reduce((acc, p) => acc + (p.showFinancialData ? p.allocatedBudget : 0), 0);
        const totalPublicAmountSpent = publicProjects.reduce((acc, p) => acc + (p.showFinancialData ? p.amountSpent : 0), 0);
        const overallUtilization = totalPublicBudget > 0 ? parseFloat(((totalPublicAmountSpent / totalPublicBudget) * 100).toFixed(1)) : 0;

        // Charts data
        const statusDistribution = [
            { name: 'On Track', count: publicProjects.filter(p => p.status === 'ON_TRACK').length },
            { name: 'Delayed', count: publicProjects.filter(p => p.status === 'DELAYED').length },
            { name: 'Critical', count: publicProjects.filter(p => p.status === 'CRITICAL').length },
            { name: 'Completed', count: publicProjects.filter(p => p.status === 'COMPLETED').length }
        ];

        res.json({
            success: true,
            data: {
                totalPublicProjects,
                underConstructionProjects,
                completedProjects,
                delayedProjects,
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
