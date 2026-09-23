const ApiError = require('../utils/ApiError');

/**
 * Central Error Handler Middleware
 *
 * Express recognises a middleware with 4 arguments (err, req, res, next)
 * as an error handler. It only runs when next(err) is called or when
 * an async route throws an error (with our asyncHandler wrapper).
 *
 * Why centralise error handling?
 * --------------------------------
 * Without this, every controller would need:
 *   if (error) return res.status(500).json({ success: false, error: '...' });
 *
 * With this, every controller just throws an ApiError and this middleware
 * handles the response uniformly. One place to update, consistent output.
 */
function errorHandler(err, req, res, next) {
  // Default to 500 if no status code is set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // Handle MongoDB duplicate key error (code 11000)
  // This fires when our unique index is violated — i.e. duplicate wishlist entry.
  // MongoDB's error message is not user-friendly, so we translate it.
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Movie is already in your wishlist';
  }

  // Handle Mongoose validation errors (e.g. required field missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // Mongoose puts individual field errors in err.errors — extract them
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Log the full error server-side for debugging.
  // In production you'd send this to a logging service (like Sentry).
  // NEVER send stack traces to the client — it leaks internal details.
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
