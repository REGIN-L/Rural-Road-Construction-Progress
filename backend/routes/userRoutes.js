const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly); // Admin only

router.get('/', getUsers);
router.put('/:id', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
