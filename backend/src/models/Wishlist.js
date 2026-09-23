const mongoose = require('mongoose');

/**
 * Wishlist Schema
 *
 * Stores the minimal data needed to render a wishlist card WITHOUT
 * making an extra API call to TMDB. When the user clicks a wishlist
 * item to view details, THEN we hit TMDB for the full movie info.
 *
 * Why these fields and not the full TMDB response?
 * - We only need enough data to show the card (poster, title, rating, year).
 * - Storing the full response wastes space and can become stale.
 * - TMDB is the source of truth for movie data; MongoDB is source of
 *   truth for the user's wishlist.
 */
const wishlistSchema = new mongoose.Schema(
  {
    // Anonymous user identifier — a UUID stored in the browser's localStorage.
    // This is how we associate a wishlist with a specific browser session
    // without requiring login.
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
    },

    // TMDB's numeric movie identifier.
    // Stored as a Number so we can pass it directly back to TMDB API calls.
    movieId: {
      type: Number,
      required: [true, 'movieId is required'],
    },

    // The fields below are denormalized (duplicated from TMDB) so that the
    // wishlist page can render without extra network requests.
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },

    posterUrl: {
      type: String,
      default: null, // Some movies have no poster — handle gracefully
    },

    releaseDate: {
      type: String, // Stored as "YYYY-MM-DD" string, not a Date object.
      default: null, // Some movies have no release date yet.
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
  },
  {
    // Mongoose automatically manages createdAt and updatedAt.
    // We use createdAt as "addedAt" — no need for a separate field.
    timestamps: true,
  }
);

/**
 * Compound Unique Index on (userId + movieId)
 *
 * This index serves two purposes:
 * 1. PERFORMANCE: Makes queries like "find all movies for userId X" fast,
 *    because MongoDB doesn't scan every document.
 * 2. UNIQUENESS: Prevents the same movie from being added twice to the same
 *    user's wishlist. MongoDB enforces this at the database level, so even
 *    if we forget to check in application code, duplicates can't happen.
 *
 * Interview answer: "I used a compound unique index on userId and movieId.
 * This gives O(log n) lookup performance and free duplicate prevention."
 */
wishlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
