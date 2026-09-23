const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const wishlistController = require('../controllers/wishlistController');
const validateUserId = require('../middleware/validateUserId');

/**
 * Wishlist Routes
 *
 * All wishlist routes use validateUserId middleware.
 * This middleware checks that the x-user-id header exists and is a valid UUID.
 * If not, it throws a 400 error before the controller even runs.
 *
 * By attaching it at the router level with router.use(), we don't have to
 * repeat the check in every controller — DRY principle.
 */
router.use(validateUserId);

// GET /api/wishlist
router.get('/', asyncHandler(wishlistController.getWishlist));

// POST /api/wishlist
router.post('/', asyncHandler(wishlistController.addToWishlist));

// DELETE /api/wishlist/:movieId
router.delete('/:movieId', asyncHandler(wishlistController.removeFromWishlist));

module.exports = router;
