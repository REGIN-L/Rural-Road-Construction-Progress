const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const fs = require('fs');
const mongoose = require('mongoose');
const Upload = require('../models/Upload');

// @desc    Upload an image file (supports 'image' or 'photo' field)
// @route   POST /api/upload
// @access  Public / Authenticated
router.post('/', (req, res) => {
    // Custom wrapper to allow either 'image' or 'photo' field
    const uploadHandler = upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'photo', maxCount: 1 }
    ]);

    uploadHandler(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Image upload failed. Allowed types: JPG, JPEG, PNG, WEBP (Max 5MB).'
            });
        }

        const file = (req.files && req.files.image && req.files.image[0]) ||
                     (req.files && req.files.photo && req.files.photo[0]) ||
                     req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
        }

        // Persist file into MongoDB if connected, ensuring survival across serverless container restarts
        if (mongoose.connection.readyState === 1 && file.path && fs.existsSync(file.path)) {
            try {
                const buffer = fs.readFileSync(file.path);
                await Upload.findOneAndUpdate(
                    { filename: file.filename },
                    {
                        filename: file.filename,
                        originalName: file.originalname || file.filename,
                        mimetype: file.mimetype || 'image/jpeg',
                        size: file.size || buffer.length,
                        data: buffer
                    },
                    { upsert: true, new: true }
                );
            } catch (dbErr) {
                console.warn('[Upload Persistent Storage Warning]: Could not save file to MongoDB:', dbErr.message);
            }
        }

        const relativeUrl = `/uploads/${file.filename}`;
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: relativeUrl,
            url: relativeUrl,
            data: {
                url: relativeUrl,
                imageUrl: relativeUrl
            },
            filename: file.filename
        });
    });
});

module.exports = router;
