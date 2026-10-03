const express = require('express');
const router = express.Router();
const {
    getExpenses,
    createExpense,
    getProjectExpenses,
    deleteExpense
} = require('../controllers/expenseController');
const { protect, adminOnly, engineerOrAdmin } = require('../middleware/auth');

router.use(protect);

router.get('/', engineerOrAdmin, getExpenses);
router.post('/', engineerOrAdmin, createExpense);
router.get('/project/:projectId', engineerOrAdmin, getProjectExpenses);
router.delete('/:id', adminOnly, deleteExpense);

module.exports = router;
