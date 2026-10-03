const User = require('../models/User');
const Project = require('../models/Project');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin Only)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        // Populate assigned projects count
        const usersWithProjects = await Promise.all(users.map(async (user) => {
            const assignedCount = await Project.countDocuments({ assignedEngineer: user._id });
            return {
                ...user.toObject(),
                assignedProjectsCount: assignedCount
            };
        }));

        res.json({
            success: true,
            count: usersWithProjects.length,
            data: usersWithProjects
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user role
// @route   PUT /api/users/:id
// @access  Private (Admin Only)
exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!role || !['ADMIN', 'ENGINEER', 'CONTRACTOR'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Valid role (ADMIN, ENGINEER, or CONTRACTOR) is required' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated successfully',
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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin Only)
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (String(user._id) === String(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
        }

        await User.findByIdAndDelete(req.params.id);

        // Unassign engineer from projects
        await Project.updateMany({ assignedEngineer: req.params.id }, { assignedEngineer: null });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
