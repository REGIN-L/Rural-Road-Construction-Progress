const mongoose = require('mongoose');

const projectCompletionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project reference is required']
    },
    contractorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Contractor reference is required']
    },
    completionPercentage: {
        type: Number,
        required: [true, 'Completion percentage is required'],
        min: [0, 'Completion percentage cannot be less than 0'],
        max: [100, 'Completion percentage cannot exceed 100']
    },
    completionDate: {
        type: Date,
        required: [true, 'Completion date is required']
    },
    completionDescription: {
        type: String,
        required: [true, 'Completion description is required'],
        trim: true
    },
    completionImage: {
        type: String,
        default: '',
        trim: true
    },
    contractorRemarks: {
        type: String,
        default: '',
        trim: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProjectCompletion', projectCompletionSchema);
