import { database } from '../config/firebase';
import { ref, set, push, get, child, update } from 'firebase/database';

export const dbService = {
    // User Management
    createUserProfile: (uid, userData) => {
        return set(ref(database, `users/${uid}`), userData);
    },

    getUserProfile: (uid) => {
        return get(ref(database, `users/${uid}`));
    },

    // Plan Management
    createPlan: (planData) => {
        const newPlanRef = push(ref(database, 'plans'));
        return set(newPlanRef, planData);
    },

    getPlans: () => {
        return get(ref(database, 'plans'));
    },

    // Task Assignment
    assignTask: (taskData) => {
        const newTaskRef = push(ref(database, 'tasks'));
        return set(newTaskRef, taskData);
    },

    getStaffTasks: (staffId) => {
        // In Realtime Database, it's better to structure tasks by staffId for performance
        // but for now we'll do a simple fetch if small scale or filter client-side
        return get(ref(database, 'tasks'));
    },

    updateSubtask: (taskId, subtaskId, status, reason = '') => {
        const updates = {};
        updates[`/tasks/${taskId}/subtasks/${subtaskId}/completed`] = status;
        updates[`/tasks/${taskId}/subtasks/${subtaskId}/reason`] = reason;
        return update(ref(database), updates);
    }
};
