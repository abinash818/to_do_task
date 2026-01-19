const express = require('express');
const router = express.Router();
const {
    assignTask,
    getTasks,
    updateTaskProgress,
    getTaskById,
} = require('../controllers/taskController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTasks)
    .post(protect, admin, assignTask);

router.route('/:id')
    .get(protect, getTaskById)
    .get(protect, getTaskById)
    .patch(protect, updateTaskProgress);

router.put('/:id/review', protect, admin, require('../controllers/taskController').reviewTask);

module.exports = router;
