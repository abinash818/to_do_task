const express = require('express');
const router = express.Router();
const {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
} = require('../controllers/planController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPlans)
    .post(protect, admin, createPlan);

router.route('/:id')
    .get(protect, getPlanById)
    .put(protect, admin, updatePlan)
    .delete(protect, admin, deletePlan);

module.exports = router;
