/**
 * ApiError — a custom error class for our application.
 *
 * Why a custom error class?
 * -------------------------
 * Node's built-in Error only has a message. We also need:
 * - statusCode → so the error handler knows which HTTP status to send
 * - isOperational → distinguishes "expected" errors (e.g. 404, 400)
 *   from unexpected bugs (e.g. a TypeError deep in our code)
 *
 * The error handler middleware reads these properties to build
 * the correct response without duplicating logic in every controller.
 *
 * Usage:
 *   throw new ApiError(404, 'Movie not found');
 *   throw new ApiError(400, "Search query 'q' is required");
 *   throw new ApiError(409, 'Movie is already in your wishlist');
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message); // sets this.message
    this.statusCode = statusCode;
    this.isOperational = true; // marks this as an expected, handled error

    // Captures the stack trace, excluding the constructor call itself.
    // Makes debugging easier when you read error logs.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
