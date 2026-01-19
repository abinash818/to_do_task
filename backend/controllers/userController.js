const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// @desc    Auth user \u0026 get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
};

// @desc    Register a new user (Admin only)
// @route   POST /api/users/create
// @access  Private/Admin
const registerUser = async (req, res) => {
    const { username, password, name, role } = req.body;

    const userExists = await User.findOne({ username: username.toLowerCase() });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        username: username.toLowerCase(),
        password,
        name,
        role,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
};

// @desc    Reset user password (Admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
const resetPassword = async (req, res) => {
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successfully' });
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.remove();
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { authUser, registerUser, getUsers, resetPassword, deleteUser };
