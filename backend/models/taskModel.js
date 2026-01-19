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
        enum: ['pending', 'processing', 'in_progress', 'waiting_approval', 'completed', 'overdue'],
        default: 'pending',
    },
    submissionNote: {
        type: String,
        default: '',
    },
    rejectionReason: {
        type: String,
        default: '',
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
    customerDetails: {
        name: String,
        address: String,
        mobile: String,
        email: String,
    },
    paymentDetails: {
        totalAmount: Number,
        paidAmount: Number,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);
