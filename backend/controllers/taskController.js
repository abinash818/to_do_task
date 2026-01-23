const Task = require('../models/taskModel');
const User = require('../models/userModel');

// Helper to update overdue status
const updateOverdueTasks = async () => {
    const now = new Date();
    await Task.updateMany(
        {
            deadline: { $lt: now },
            status: { $nin: ['completed', 'overdue'] }
        },
        { status: 'overdue' }
    );
};

// @desc    Assign a task to a staff member
// @route   POST /api/tasks
// @access  Private/Admin
const assignTask = async (req, res) => {
    const { title, description, assignedTo, managerId, planId, subtasks, deadline, customerDetails, paymentDetails, valuationDetails } = req.body;

    if (!title || !assignedTo || !deadline) {
        res.status(400).json({ message: 'Please provide title, assignedTo, and deadline' });
        return;
    }

    // Verify staff exists (Can be staff or manager)
    const staff = await User.findById(assignedTo);
    if (!staff || (staff.role !== 'staff' && staff.role !== 'manager')) {
        res.status(400).json({ message: 'Invalid staff member' });
        return;
    }

    const task = await Task.create({
        title,
        description,
        assignedTo,
        managerId,
        plan: planId,
        subtasks: subtasks.map(s => ({
            title: s.title || s,
            completed: false,
            status: 'pending',
            reason: ''
        })),
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

// @desc    Get all tasks (Admin) or user tasks (Staff/Manager)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    await updateOverdueTasks();

    let tasks;
    if (req.user.role === 'admin') {
        tasks = await Task.find({})
            .populate('assignedTo', 'name username')
            .populate('managerId', 'name username')
            .populate('plan', 'name');
    } else if (req.user.role === 'manager') {
        // Managers see tasks they manage OR are assigned to
        tasks = await Task.find({
            $or: [
                { managerId: req.user._id },
                { assignedTo: req.user._id }
            ]
        }).populate('assignedTo', 'name username').populate('assignedBy', 'name');
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
        // Only assigned staff, manager or admin can update
        const isAssigned = task.assignedTo.toString() === req.user._id.toString();
        const isManager = task.managerId && task.managerId.toString() === req.user._id.toString();

        if (!isAssigned && !isManager && req.user.role !== 'admin') {
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

// @desc    Review Subtask (Manager/Admin)
// @route   PUT /api/tasks/:id/subtask/:subtaskId
// @access  Private
const reviewSubtask = async (req, res) => {
    const { status, managerNote } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is manager of this task or admin
    const isManager = task.managerId && task.managerId.toString() === req.user._id.toString();
    if (!isManager && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Only managers can approve subtasks' });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
        return res.status(404).json({ message: 'Subtask not found' });
    }

    subtask.status = status; // 'completed' or 'rejected'
    if (status === 'completed') {
        subtask.completed = true;
    } else if (status === 'rejected') {
        subtask.completed = false;
    }
    subtask.managerNote = managerNote;

    const updatedTask = await task.save();
    res.json(updatedTask);
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
    } else if (status === 'in_progress' || status === 'pending') {
        task.status = status;
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
        .populate('managerId', 'name username')
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
    reviewSubtask,
};
