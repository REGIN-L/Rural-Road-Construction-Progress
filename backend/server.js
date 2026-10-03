const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const path = require('path');

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect only. User and project records are created explicitly by the owner.
connectDB().catch((err) => {
    console.error('[Database Error]:', err.message);
});

const mongoose = require('mongoose');

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

// Static uploads serving for completion and query images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/deletion-requests', require('./routes/deletionRequestRoutes'));
app.use('/api/public-queries', require('./routes/publicQueryRoutes'));

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found – ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 RuralConnect Backend API running on http://localhost:${PORT}`);
});
