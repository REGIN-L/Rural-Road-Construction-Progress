const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err.message || err);

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Internal Server Error';

    // Handle Mongoose Validation Error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors || {}).map(e => e.message);
        message = messages.join('. ') || 'Validation failed for request data.';
    }

    // Handle Mongoose CastError / BSONError (e.g. invalid ObjectId)
    if (err.name === 'CastError' || err.name === 'BSONError' || String(err.message).includes('Cast to ObjectId failed') || String(err.message).includes('BSONError')) {
        statusCode = 400;
        const path = err.path || 'identifier';
        message = `Invalid data format provided for ${path}. Please ensure a valid reference is supplied.`;
    }

    // Handle duplicate key error (code 11000)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `A record with this ${field} already exists.`;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Invalid or expired authentication session. Please sign in again.';
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = errorHandler;
