const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    submitCompletion,
    getCompletion,
    addProgressUpdate,
    getProgressUpdates
} = require('../controllers/projectController');
const { createDeletionRequest } = require('../controllers/deletionRequestController');
const { protect, adminOnly, engineerOrAdmin, projectViewer, progressUpdater } = require('../middleware/auth');

router.use(protect); // All project routes require auth

// Projects collection
router.get('/', projectViewer, getProjects);
router.get('/:id', projectViewer, getProjectById);
router.post('/', engineerOrAdmin, createProject); // Admin AND Engineer can create projects
router.put('/:id', engineerOrAdmin, updateProject);
router.delete('/:id', adminOnly, deleteProject); // STRICTLY Admin only

// Project Deletion Request (Engineer submits request for Admin review)
router.post('/:id/deletion-request', engineerOrAdmin, createDeletionRequest);

// Project Completion (Contractor submits completion evidence)
router.post('/:id/completion', progressUpdater, submitCompletion);
router.get('/:id/completion', projectViewer, getCompletion);

// Project Progress Updates
router.post('/:id/progress', progressUpdater, addProgressUpdate);
router.get('/:id/progress', projectViewer, getProgressUpdates);

module.exports = router;
