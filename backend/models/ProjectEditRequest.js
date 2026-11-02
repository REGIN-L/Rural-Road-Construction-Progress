const mongoose = require('mongoose');

const projectEditRequestSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project reference is required']
    },
    projectName: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true
    },
    projectCode: {
        type: String,
        trim: true,
        default: ''
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Requester is required']
    },
    requestedByRole: {
        type: String,
        default: 'ENGINEER'
    },
    requestedChanges: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Requested changes object is required']
    },
    reason: {
        type: String,
        required: [true, 'Reason for change is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    adminComment: {
        type: String,
        default: '',
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProjectEditRequest', projectEditRequestSchema);
