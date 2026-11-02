const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Detect serverless environment (Vercel, AWS Lambda)
const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NOW_REGION
);

// Determine upload directory safely
const getUploadDir = () => {
    if (isServerless) {
        return path.join('/tmp', 'uploads');
    }
    return path.join(__dirname, '..', 'uploads');
};

const uploadDir = getUploadDir();

// Ensure upload directory exists without crashing on read-only environments
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.warn(`[Upload Middleware]: Could not create initial upload directory ${uploadDir}: ${err.message}. Fallback will be handled at request time.`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const targetDir = getUploadDir();
        try {
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            cb(null, targetDir);
        } catch (err) {
            // Fallback to os.tmpdir() or /tmp/uploads
            try {
                const fallbackDir = path.join(os.tmpdir(), 'uploads');
                if (!fs.existsSync(fallbackDir)) {
                    fs.mkdirSync(fallbackDir, { recursive: true });
                }
                cb(null, fallbackDir);
            } catch (fallbackErr) {
                cb(fallbackErr);
            }
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (ext && mime) {
        return cb(null, true);
    }
    cb(new Error('Only image files (JPG, JPEG, PNG, WEBP) are allowed!'));
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter
});

module.exports = upload;
