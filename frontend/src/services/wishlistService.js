import api from './api';

/**
 * Wishlist Service
 *
 * Abstracts all wishlist-related endpoints.
 * Because of the api.js interceptor, we do NOT need to pass the userId
 * to these functions! It's added to the headers automatically.
 */

export const wishlistService = {
  /**
   * Gets the user's entire wishlist.
   */
  async getWishlist() {
    const response = await api.get('/wishlist');
    return response.data.data;
  },

  /**
   * Adds a movie to the wishlist.
   * @param {Object} movie The normalized movie object from the movieService
   */
  async addMovie(movie) {
    const response = await api.post('/wishlist', {
      movieId: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      releaseDate: movie.releaseDate,
      rating: movie.rating
    });
    return response.data;
  },

  /**
   * Removes a movie from the wishlist.
   * @param {number} movieId The TMDB movie ID
   */
  async removeMovie(movieId) {
    const response = await api.delete(`/wishlist/${movieId}`);
    return response.data;
  }
};
