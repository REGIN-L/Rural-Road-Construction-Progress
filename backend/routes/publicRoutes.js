const express = require('express');
const router = express.Router();
const {
    getPublicProjects,
    getPublicProjectById,
    searchPublicProjects,
    getPublicStats
} = require('../controllers/publicController');

router.get('/projects', getPublicProjects);
router.get('/projects/search', searchPublicProjects);
router.get('/projects/:id', getPublicProjectById);
router.get('/stats', getPublicStats);

module.exports = router;
