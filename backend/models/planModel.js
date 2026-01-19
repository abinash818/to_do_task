const mongoose = require('mongoose');

const planSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a plan name'],
    },
    description: {
        type: String,
    },
    maxDays: {
        type: Number,
        default: 7,
        min: 1,
    },
    subtasks: [{
        title: {
            type: String,
            required: true,
        },
        maxDays: {
            type: Number,
            default: 1,
            min: 1,
        },
        isMandatory: {
            type: Boolean,
            default: true,
        }
    }],
    variants: [{
        name: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
            min: 1
        },
        subtasks: [{
            title: {
                type: String,
                required: true,
            },
            maxDays: {
                type: Number,
                default: 1
            },
            isMandatory: {
                type: Boolean,
                default: true,
            }
        }]
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Plan', planSchema);
