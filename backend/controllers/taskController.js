const Task = require('../models/taskModel');
const User = require('../models/userModel');

// @desc    Assign a task to a staff member
// @route   POST /api/tasks
// @access  Private/Admin
const assignTask = async (req, res) => {
    const { title, description, assignedTo, planId, subtasks, deadline, customerDetails, paymentDetails, valuationDetails } = req.body;

    if (!title || !assignedTo || !deadline) {
        res.status(400).json({ message: 'Please provide title, assignedTo, and deadline' });
        return;
    }

    // Verify staff exists
    const staff = await User.findById(assignedTo);
    if (!staff || staff.role !== 'staff') {
        res.status(400).json({ message: 'Invalid staff member' });
        return;
    }

    const task = await Task.create({
        title,
        description,
        assignedTo,
        plan: planId,
        subtasks: subtasks.map(s => ({ title: s.title || s, completed: false, reason: '' })),
        deadline,
        assignedBy: req.user._id,
        customerDetails,
        paymentDetails,
        valuationDetails,
    });

    if (task) {
        res.status(201).json(task);
    } else {
        res.status(400).json({ message: 'Invalid task data' });
    }
};

// @desc    Get all tasks (Admin) or user tasks (Staff)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    let tasks;
    if (req.user.role === 'admin') {
        tasks = await Task.find({}).populate('assignedTo', 'name username').populate('plan', 'name');
    } else {
        tasks = await Task.find({ assignedTo: req.user._id }).populate('assignedBy', 'name');
    }
    res.json(tasks);
};

// @desc    Update task status or subtasks (Staff)
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTaskProgress = async (req, res) => {
    const { subtasks, status, submissionNote } = req.body;

    const task = await Task.findById(req.params.id);

    if (task) {
        // Only assigned staff or admin can update
        if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        if (subtasks) task.subtasks = subtasks;
        if (status) task.status = status;
        if (submissionNote) task.submissionNote = submissionNote;

        // If staff completes task, change to waiting_approval instead of completed
        if (status === 'completed' && req.user.role !== 'admin') {
            task.status = 'waiting_approval';
        }

        const updatedTask = await task.save();
        res.json(updatedTask);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
};

// @desc    Review Task (Admin Approve/Reject)
// @route   PUT /api/tasks/:id/review
// @access  Private/Admin
const reviewTask = async (req, res) => {
    const { status, rejectionReason } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    if (status === 'completed') {
        task.status = 'completed';
        task.rejectionReason = ''; // Clear previous rejection
    } else if (status === 'in_progress') {
        task.status = 'in_progress';
        task.rejectionReason = rejectionReason || 'Rejected by Admin';
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate('assignedTo', 'name username')
        .populate('assignedBy', 'name')
        .populate('plan', 'name');

    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
};

module.exports = {
    assignTask,
    getTasks,
    updateTaskProgress,
    getTaskById,
    reviewTask,
};
