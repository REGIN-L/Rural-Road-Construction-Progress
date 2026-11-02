const mongoose = require('mongoose');

const progressUpdateSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID reference is required']
    },
    progress: {
        type: Number,
        required: [true, 'Progress percentage is required'],
        min: [0, 'Progress cannot be less than 0'],
        max: [100, 'Progress cannot exceed 100']
    },
    progressPercentage: {
        type: Number,
        min: 0,
        max: 100
    },
    workDescription: {
        type: String,
        required: [true, 'Work description is required'],
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    photoUrl: {
        type: String,
        default: '',
        trim: true
    },
    remarks: {
        type: String,
        default: '',
        trim: true
    },
    amountSpent: {
        type: Number,
        default: 0,
        min: 0
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    contractorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    contractorName: {
        type: String,
        default: '',
        trim: true
    },
    isPublic: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Middleware to sync progress/progressPercentage and workDescription/notes
progressUpdateSchema.pre('validate', function () {
    if (this.progress !== undefined && this.progressPercentage === undefined) {
        this.progressPercentage = this.progress;
    } else if (this.progressPercentage !== undefined && this.progress === undefined) {
        this.progress = this.progressPercentage;
    }

    if (this.workDescription && !this.notes) {
        this.notes = this.workDescription;
    } else if (this.notes && !this.workDescription) {
        this.workDescription = this.notes;
    }
});

module.exports = mongoose.model('ProgressUpdate', progressUpdateSchema);
