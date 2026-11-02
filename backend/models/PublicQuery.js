const mongoose = require('mongoose');

const publicQuerySchema = new mongoose.Schema({
    queryId: {
        type: String,
        required: [true, 'Query ID is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    contactInfo: {
        type: String,
        default: '',
        trim: true
    },
    queryType: {
        type: String,
        required: [true, 'Query type is required'],
        trim: true
    },
    requestType: {
        type: String,
        enum: ['FEEDBACK', 'NEW_ROAD_REQUEST'],
        default: 'FEEDBACK'
    },
    roadName: {
        type: String,
        default: '',
        trim: true
    },
    startPoint: {
        type: String,
        default: '',
        trim: true
    },
    endPoint: {
        type: String,
        default: '',
        trim: true
    },
    reason: {
        type: String,
        default: '',
        trim: true
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    district: {
        type: String,
        required: [true, 'District is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location / Village is required'],
        trim: true
    },
    village: {
        type: String,
        default: '',
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    image: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['Submitted', 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Submitted'
    },
    adminResponse: {
        type: String,
        default: '',
        trim: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    submittedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        set: function (val) {
            if (!val || val === 'user_citizen' || !mongoose.Types.ObjectId.isValid(val)) {
                return null;
            }
            return val;
        }
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    staffNotes: {
        type: String,
        default: ''
    },
    isApprovedForProject: {
        type: Boolean,
        default: false
    },
    createdProjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PublicQuery', publicQuerySchema);
