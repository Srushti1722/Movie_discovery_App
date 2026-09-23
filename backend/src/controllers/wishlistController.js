const ApiError = require('../utils/ApiError');
const wishlistService = require('../services/wishlistService');

/**
 * Wishlist Controller
 */

/**
 * GET /api/wishlist
 * Returns all wishlist items for the current user.
 * req.userId is set by validateUserId middleware.
 */
async function getWishlist(req, res) {
  const wishlist = await wishlistService.getWishlist(req.userId);
  res.json({ success: true, data: wishlist });
}

/**
 * POST /api/wishlist
 * Adds a movie to the wishlist.
 */
async function addToWishlist(req, res) {
  const { movieId, title, posterUrl, releaseDate, rating } = req.body;

  // Validate required fields
  if (!movieId || !title) {
    throw new ApiError(400, 'movieId and title are required');
  }

  if (typeof movieId !== 'number' || movieId <= 0) {
    throw new ApiError(400, 'movieId must be a positive number');
  }

  const newItem = await wishlistService.addToWishlist(req.userId, {
    movieId,
    title,
    posterUrl,
    releaseDate,
    rating,
  });

  res.status(201).json({ success: true, data: newItem });
}

/**
 * DELETE /api/wishlist/:movieId
 * Removes a movie from the wishlist.
 */
async function removeFromWishlist(req, res) {
  const movieId = parseInt(req.params.movieId, 10);

  if (isNaN(movieId) || movieId <= 0) {
    throw new ApiError(400, 'Movie ID must be a positive integer');
  }

  await wishlistService.removeFromWishlist(req.userId, movieId);

  res.json({ success: true, data: { message: 'Removed from wishlist' } });
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
