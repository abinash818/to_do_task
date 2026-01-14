const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title'],
    },
    description: {
        type: String,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
    },
    subtasks: [{
        title: String,
        completed: {
            type: Boolean,
            default: false,
        },
        reason: {
            type: String,
            default: '',
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'overdue'],
        default: 'pending',
    },
    deadline: {
        type: Date,
        required: [true, 'Please add a deadline'],
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);
