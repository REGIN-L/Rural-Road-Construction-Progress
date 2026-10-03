const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, projectViewer } = require('../middleware/auth');

router.use(protect);
router.get('/stats', projectViewer, getDashboardStats);

module.exports = router;
