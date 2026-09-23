const Wishlist = require('../models/Wishlist');
const ApiError = require('../utils/ApiError');

/**
 * Wishlist Service
 *
 * Handles all MongoDB operations for the wishlist.
 * Controllers pass the validated data here; this service executes
 * the database commands and returns the result.
 */

/**
 * Retrieves the entire wishlist for a specific user.
 * Sorted by newest first.
 *
 * @param {string} userId
 * @returns {Array} Array of wishlist movie objects
 */
async function getWishlist(userId) {
  // .find() returns an array. If none found, returns [].
  // .sort({ createdAt: -1 }) ensures the most recently added movies appear first.
  // .select('-__v -updatedAt -_id') removes internal MongoDB fields we don't want to expose to the frontend.
  const wishlist = await Wishlist.find({ userId })
    .sort({ createdAt: -1 })
    .select('-_id -__v -updatedAt -userId'); // We exclude userId because the user already knows who they are

  return wishlist;
}

/**
 * Adds a movie to the user's wishlist.
 *
 * @param {string} userId
 * @param {object} movieData { movieId, title, posterUrl, releaseDate, rating }
 * @returns {object} The created wishlist document
 */
async function addToWishlist(userId, movieData) {
  // We use .create() here.
  // If the user tries to add a movie they already have, MongoDB will throw a
  // duplicate key error (code 11000) because of the unique compound index we defined.
  // We do NOT need to check if it exists first! We just try to insert, and let the
  // central errorHandler middleware translate the 11000 error into a 409 Conflict.
  const newItem = await Wishlist.create({
    userId,
    ...movieData,
  });

  // Convert the Mongoose document to a plain JS object and remove internal fields
  const result = newItem.toObject();
  delete result._id;
  delete result.__v;
  delete result.updatedAt;
  delete result.userId;

  return result;
}

/**
 * Removes a movie from the user's wishlist.
 *
 * @param {string} userId
 * @param {number} movieId
 */
async function removeFromWishlist(userId, movieId) {
  // findOneAndDelete is atomic. It finds the exact document and removes it in one step.
  const deletedItem = await Wishlist.findOneAndDelete({ userId, movieId });

  if (!deletedItem) {
    // If deletedItem is null, the movie wasn't in their wishlist to begin with.
    throw new ApiError(404, 'Movie not found in your wishlist');
  }

  return true;
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
