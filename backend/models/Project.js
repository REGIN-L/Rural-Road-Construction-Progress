const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: [true, 'Project ID is required'],
        unique: true,
        trim: true
    },
    projectName: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true
    },
    village: {
        type: String,
        required: [true, 'Village name is required'],
        trim: true
    },
    district: {
        type: String,
        required: [true, 'District name is required'],
        trim: true
    },
    state: {
        type: String,
        default: 'Tamil Nadu',
        trim: true
    },
    roadLength: {
        type: Number,
        required: [true, 'Road length in km is required'],
        min: [0.1, 'Road length must be positive']
    },
    allocatedBudget: {
        type: Number,
        required: [true, 'Allocated budget is required'],
        min: [0, 'Allocated budget cannot be negative']
    },
    amountSpent: {
        type: Number,
        default: 0,
        min: [0, 'Amount spent cannot be negative']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    expectedCompletion: {
        type: Date,
        required: [true, 'Expected completion date is required']
    },
    currentProgress: {
        type: Number,
        default: 0,
        min: [0, 'Progress cannot be less than 0'],
        max: [100, 'Progress cannot exceed 100']
    },
    contractor: {
        type: String,
        default: 'Unassigned Contractor',
        trim: true
    },
    contractorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    creatorRole: {
        type: String,
        enum: ['ADMIN', 'ENGINEER'],
        default: 'ADMIN'
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: [
            'Planned', 'Ongoing', 'Delayed', 'Completed',
            'In Progress', 'Not Started', 'On Track', 'Critical',
            'NOT_STARTED', 'IN_PROGRESS', 'ON_TRACK', 'DELAYED', 'CRITICAL', 'COMPLETED'
        ],
        default: 'Planned',
        set: function (val) {
            if (!val) return 'Planned';
            const s = String(val).trim();
            if (s === 'In Progress' || s === 'IN_PROGRESS') return 'Ongoing';
            if (s === 'Not Started' || s === 'NOT_STARTED') return 'Planned';
            if (s === 'On Track' || s === 'ON_TRACK') return 'Ongoing';
            if (s === 'Critical' || s === 'CRITICAL') return 'Delayed';
            return s;
        }
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    showContractor: {
        type: Boolean,
        default: true
    },
    showFinancialData: {
        type: Boolean,
        default: true
    },
    publicDescription: {
        type: String,
        default: ''
    },
    // GPS & GIS Geotagging Fields
    latitude: {
        type: Number,
        default: null,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        default: null,
        min: -180,
        max: 180
    },
    coordinates: {
        lat: {
            type: Number,
            default: null
        },
        lng: {
            type: Number,
            default: null
        },
        path: {
            type: [[Number]],
            default: []
        }
    },
    isGeotagged: {
        type: Boolean,
        default: false
    },
    assignedEngineer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    completion: {
        completionPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },
        completionDate: {
            type: Date,
            default: null
        },
        completionDescription: {
            type: String,
            default: '',
            trim: true
        },
        completionImage: {
            type: String,
            default: '',
            trim: true
        },
        completionPhoto: {
            type: String,
            default: '',
            trim: true
        },
        contractorRemarks: {
            type: String,
            default: '',
            trim: true
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        submittedAt: {
            type: Date,
            default: null
        }
    },
    latestProgressPhoto: {
        type: String,
        default: '',
        trim: true
    },
    latestProgressUpdate: {
        progress: { type: Number, default: 0 },
        workDescription: { type: String, default: '' },
        photoUrl: { type: String, default: '' },
        updatedAt: { type: Date, default: null }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
