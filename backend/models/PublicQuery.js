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
        enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending'
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PublicQuery', publicQuerySchema);
