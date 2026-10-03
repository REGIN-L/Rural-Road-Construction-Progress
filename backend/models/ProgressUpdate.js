const mongoose = require('mongoose');

const progressUpdateSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    progress: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    amountSpent: {
        type: Number,
        default: 0,
        min: 0
    },
    notes: {
        type: String,
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProgressUpdate', progressUpdateSchema);
