import api from './api';

/**
 * Movie Service
 *
 * Abstracts all movie-related endpoints.
 * Returns only the actual data, stripping away the axios response wrapper.
 */

export const movieService = {
  /**
   * Fetches trending/discover movies.
   * @param {Object} params { page, genre, sort }
   */
  async getMovies(params = { page: 1, sort: 'popularity.desc' }) {
    const response = await api.get('/movies', { params });
    // Our backend always returns { success: true, data: [...], pagination: {...} }
    return response.data;
  },

  /**
   * Searches for movies by title.
   * @param {string} query Search term
   * @param {number} page Page number
   * @param {AbortSignal} signal Signal to cancel the request if user types fast
   */
  async searchMovies(query, page = 1, signal) {
    const response = await api.get('/movies/search', {
      params: { q: query, page },
      signal // Passes the abort signal down to axios
    });
    return response.data;
  },

  /**
   * Fetches full details for a single movie.
   * @param {number} id Movie ID
   */
  async getMovieById(id) {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

  /**
   * Fetches the list of all available genres.
   */
  async getGenres() {
    const response = await api.get('/movies/genres');
    return response.data.data; // Only return the array of genres
  }
};
