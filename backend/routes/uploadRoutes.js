const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// @desc    Upload an image file
// @route   POST /api/upload
// @access  Public / Authenticated
router.post('/', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Image upload failed. Allowed types: JPG, JPEG, PNG, WEBP (Max 5MB).'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
        }

        const relativeUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: relativeUrl,
            filename: req.file.filename
        });
    });
});

module.exports = router;
