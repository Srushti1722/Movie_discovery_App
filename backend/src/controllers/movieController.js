const ApiError = require('../utils/ApiError');
const tmdbService = require('../services/tmdbService');

/**
 * Movie Controller
 *
 * Controllers are intentionally thin.
 * Their job: validate input → call service → send response.
 * All TMDB logic and caching lives in tmdbService.
 */

const ALLOWED_SORT_VALUES = [
  'popularity.desc',
  'popularity.asc',
  'vote_average.desc',
  'release_date.desc',
];

/**
 * GET /api/movies?page=1&genre=28&sort=popularity.desc
 */
async function getMovies(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const genre = req.query.genre ? parseInt(req.query.genre, 10) : undefined;
  const sort = req.query.sort || 'popularity.desc';

  if (page < 1 || isNaN(page)) {
    throw new ApiError(400, 'page must be a positive integer');
  }

  if (sort && !ALLOWED_SORT_VALUES.includes(sort)) {
    throw new ApiError(400, `Invalid sort value. Allowed: ${ALLOWED_SORT_VALUES.join(', ')}`);
  }

  // genre must be a valid number if provided
  if (req.query.genre && isNaN(genre)) {
    throw new ApiError(400, 'genre must be a valid genre ID');
  }

  const { movies, pagination } = await tmdbService.getMovies({ page, genre, sort });

  res.json({ success: true, data: movies, pagination });
}

/**
 * GET /api/movies/genres
 */
async function getGenres(req, res) {
  const genres = await tmdbService.getGenres();
  res.json({ success: true, data: genres });
}

/**
 * GET /api/movies/search?q=batman&page=1
 */
async function searchMovies(req, res) {
  const { q, page = 1 } = req.query;

  if (!q || q.trim() === '') {
    throw new ApiError(400, "Search query 'q' is required");
  }

  if (q.trim().length > 100) {
    throw new ApiError(400, 'Search query is too long (max 100 characters)');
  }

  const pageNum = parseInt(page, 10) || 1;

  const { movies, pagination } = await tmdbService.searchMovies(q.trim(), pageNum);

  res.json({ success: true, data: movies, pagination });
}

/**
 * GET /api/movies/:id
 */
async function getMovieById(req, res) {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id <= 0) {
    throw new ApiError(400, 'Movie ID must be a positive integer');
  }

  const movie = await tmdbService.getMovieById(id);

  res.json({ success: true, data: movie });
}

module.exports = { getMovies, getGenres, searchMovies, getMovieById };
