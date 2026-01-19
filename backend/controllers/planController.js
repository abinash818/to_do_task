const Plan = require('../models/planModel');

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
    const { name, description, subtasks, maxDays, variants } = req.body;

    if (!name || !subtasks || subtasks.length === 0) {
        res.status(400).json({ message: 'Please add a name and at least one subtask' });
        return;
    }

    const plan = await Plan.create({
        name,
        description,
        subtasks,
        maxDays,
        variants,
        createdBy: req.user._id,
    });

    if (plan) {
        res.status(201).json(plan);
    } else {
        res.status(400).json({ message: 'Invalid plan data' });
    }
};

// @desc    Get all plans
// @route   GET /api/plans
// @access  Private
const getPlans = async (req, res) => {
    const plans = await Plan.find({});
    res.json(plans);
};

// @desc    Get plan by ID
// @route   GET /api/plans/:id
// @access  Private
const getPlanById = async (req, res) => {
    const plan = await Plan.findById(req.params.id);

    if (plan) {
        res.json(plan);
    } else {
        res.status(404).json({ message: 'Plan not found' });
    }
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
    const { name, description, subtasks, maxDays, variants } = req.body;

    const plan = await Plan.findById(req.params.id);

    if (plan) {
        plan.name = name || plan.name;
        plan.description = description || plan.description;
        plan.subtasks = subtasks || plan.subtasks;
        plan.maxDays = maxDays || plan.maxDays;
        plan.variants = variants || plan.variants;

        const updatedPlan = await plan.save();
        res.json(updatedPlan);
    } else {
        res.status(404).json({ message: 'Plan not found' });
    }
};

// @desc    Delete a plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
    const plan = await Plan.findById(req.params.id);

    if (plan) {
        await plan.deleteOne();
        res.json({ message: 'Plan removed' });
    } else {
        res.status(404).json({ message: 'Plan not found' });
    }
};

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
};
