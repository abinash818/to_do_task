const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUsers, resetPassword } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.post('/create', protect, admin, registerUser);
router.get('/', protect, admin, getUsers);
router.put('/:id/reset-password', protect, admin, resetPassword);

module.exports = router;
