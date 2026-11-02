const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serverless-friendly DB connection: connect immediately and ensure connection on incoming requests
connectDB().catch((err) => {
    console.error('[Database Error]:', err.message);
});

app.use(async (req, res, next) => {
    if (mongoose.connection.readyState !== 1 && process.env.MONGO_URI) {
        try {
            await connectDB();
        } catch (_) {}
    }
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.json({
        status: 'Operational',
        database: isDbConnected ? 'Connected to MongoDB Atlas' : 'Local Fallback Store (Connecting to Atlas in background)',
        system: 'RuralConnect API',
        time: new Date().toISOString()
    });
});

// Static uploads serving for completion and query images (local disk)
const localUploadsDir = path.join(__dirname, 'uploads');
try {
    if (fs.existsSync(localUploadsDir)) {
        app.use('/uploads', express.static(localUploadsDir));
    }
} catch (_) {}

// Also serve from serverless /tmp/uploads if running on Vercel/Lambda
try {
    const tmpUploadsDir = path.join('/tmp', 'uploads');
    if (fs.existsSync(tmpUploadsDir)) {
        app.use('/uploads', express.static(tmpUploadsDir));
    }
} catch (_) {}

// Persistent fallback handler for uploaded images:
// If file is not present on ephemeral container disk, retrieve it straight from MongoDB
app.get('/uploads/:filename', async (req, res) => {
    try {
        const Upload = require('./models/Upload');
        const file = await Upload.findOne({ filename: req.params.filename });
        if (file && file.data) {
            res.set('Content-Type', file.mimetype || 'image/jpeg');
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
            return res.send(file.data);
        }
    } catch (err) {
        console.warn('[Upload Serve Notice]:', err.message);
    }
    return res.status(404).json({ success: false, message: 'Image not found' });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/deletion-requests', require('./routes/deletionRequestRoutes'));
app.use('/api/project-edit-requests', require('./routes/projectEditRequestRoutes'));
app.use('/api/public-queries', require('./routes/publicQueryRoutes'));

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found – ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL && (require.main === module || !process.env.VERCEL_ENV)) {
    app.listen(PORT, () => {
        console.log(`🚀 RuralConnect Backend API running on http://localhost:${PORT}`);
    });
}

module.exports = app;
