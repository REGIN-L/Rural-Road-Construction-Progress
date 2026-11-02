const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    originalName: {
        type: String,
        default: ''
    },
    mimetype: {
        type: String,
        required: true,
        default: 'image/jpeg'
    },
    size: {
        type: Number,
        default: 0
    },
    data: {
        type: Buffer,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Upload', uploadSchema);
