const Expense = require('../models/Expense');
const Project = require('../models/Project');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private (Admin / Engineer)
exports.getExpenses = async (req, res, next) => {
    try {
        const expenses = await Expense.find()
            .populate('projectId', 'projectId projectName village district')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private (Admin / Engineer)
exports.createExpense = async (req, res, next) => {
    try {
        const { projectId, category, amount, description, date } = req.body;

        if (!projectId || !category || !amount) {
            return res.status(400).json({ success: false, message: 'Project, category, and amount are required' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const expense = await Expense.create({
            projectId,
            category,
            amount: Number(amount),
            description: description || '',
            date: date || Date.now(),
            createdBy: req.user.id
        });

        // Automatically sync total amountSpent on project
        const allExpenses = await Expense.find({ projectId });
        const totalSpent = allExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        project.amountSpent = totalSpent;
        await project.save();

        res.status(201).json({
            success: true,
            message: 'Expense logged successfully',
            data: expense
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get expenses for a specific project
// @route   GET /api/expenses/project/:projectId
// @access  Private (Admin / Engineer)
exports.getProjectExpenses = async (req, res, next) => {
    try {
        const expenses = await Expense.find({ projectId: req.params.projectId })
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin)
exports.deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense record not found' });
        }

        const projId = expense.projectId;
        await Expense.findByIdAndDelete(req.params.id);

        // Recalculate project amountSpent
        if (projId) {
            const allExpenses = await Expense.find({ projectId: projId });
            const totalSpent = allExpenses.reduce((acc, exp) => acc + exp.amount, 0);
            await Project.findByIdAndUpdate(projId, { amountSpent: totalSpent });
        }

        res.json({
            success: true,
            message: 'Expense record deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
