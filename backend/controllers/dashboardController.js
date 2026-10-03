const Project = require('../models/Project');

// @desc    Get dashboard metrics & analytics
// @route   GET /api/dashboard/stats
// @access  Private (Admin / Engineer)
exports.getDashboardStats = async (req, res, next) => {
    try {
        let filter = {};
        if (req.user.role === 'ENGINEER') {
            filter.assignedEngineer = req.user.id;
        }

        const projects = await Project.find(filter);

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'ON_TRACK').length;
        const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
        const delayedProjects = projects.filter(p => p.status === 'DELAYED').length;
        const criticalProjects = projects.filter(p => p.status === 'CRITICAL').length;

        const totalBudget = projects.reduce((acc, p) => acc + p.allocatedBudget, 0);
        const totalSpent = projects.reduce((acc, p) => acc + p.amountSpent, 0);
        const remainingBudget = Math.max(0, totalBudget - totalSpent);
        const fundUtilization = totalBudget > 0 ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(1)) : 0;

        const totalProgressSum = projects.reduce((acc, p) => acc + p.currentProgress, 0);
        const avgProgress = totalProjects > 0 ? parseFloat((totalProgressSum / totalProjects).toFixed(1)) : 0;

        // Chart 1: Status Donut Chart
        const statusChart = [
            { name: 'On Track', count: activeProjects, color: '#10b981' },
            { name: 'Delayed', count: delayedProjects, color: '#f59e0b' },
            { name: 'Critical', count: criticalProjects, color: '#ef4444' },
            { name: 'Completed', count: completedProjects, color: '#3b82f6' }
        ];

        // Chart 2: Project-wise Budget vs Expenditure
        const financialComparison = projects.slice(0, 8).map(p => ({
            name: p.projectId,
            fullName: p.projectName,
            Allocated: p.allocatedBudget,
            Spent: p.amountSpent,
            Progress: p.currentProgress
        }));

        res.json({
            success: true,
            data: {
                totalProjects,
                activeProjects,
                completedProjects,
                delayedProjects,
                criticalProjects,
                totalBudget,
                totalSpent,
                remainingBudget,
                fundUtilization,
                avgProgress,
                statusChart,
                financialComparison
            }
        });
    } catch (error) {
        next(error);
    }
};
