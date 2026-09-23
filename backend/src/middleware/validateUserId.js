const ApiError = require('../utils/ApiError');

/**
 * validateUserId Middleware
 *
 * Checks that the x-user-id header is present on every wishlist request.
 * This is the anonymous user identifier stored in the browser's localStorage.
 *
 * Why middleware instead of checking in each controller?
 * -------------------------------------------------------
 * The wishlist router applies this to all its routes with router.use().
 * That means the check runs once, in one place, for all wishlist routes.
 * If we add a new wishlist route later, it's automatically protected.
 *
 * We do a basic format check (UUID-like) to catch obvious mistakes,
 * but we don't enforce strict UUID validation — this isn't a security
 * boundary, just a session identifier.
 */
function validateUserId(req, res, next) {
  const userId = req.headers['x-user-id'];

  if (!userId || userId.trim() === '') {
    throw new ApiError(400, 'User ID header (x-user-id) is required');
  }

  // Trim and attach to req so controllers can use req.userId directly
  req.userId = userId.trim();
  next();
}

module.exports = validateUserId;
