const axios = require('axios');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache');
const { normalizeMovieSummary, normalizeMovieDetail } = require('../utils/normalizeMovie');

/**
 * TMDB Service
 *
 * This is the ONLY place in the entire codebase that talks to TMDB.
 * It is responsible for:
 * 1. Building the correct TMDB API URL
 * 2. Checking the cache before making a network request
 * 3. Storing results in the cache after a successful request
 * 4. Normalizing the response before returning it
 * 5. Translating TMDB errors into our own ApiError format
 *
 * Controllers call this service — they never call axios directly.
 *
 * Why this boundary?
 * If TMDB changes their API or you switch to a different movie data source,
 * you change ONLY this file. Controllers and routes stay untouched.
 */

// ─────────────────────────────────────────────
// Axios instance pre-configured for TMDB
// ─────────────────────────────────────────────
// Using an axios instance (instead of bare axios) lets us set base URL
// and default params ONCE here. All TMDB calls automatically get the
// api_key appended — no risk of forgetting it on one request.
const tmdbClient = axios.create({
  baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
  timeout: 8000, // 8 seconds — if TMDB takes longer, fail fast
  params: {
    api_key: process.env.TMDB_API_KEY,
  },
});

// ─────────────────────────────────────────────
// Allowed sort values — single source of truth
// ─────────────────────────────────────────────
// Validated in the controller AND used here.
// The values match TMDB's sort_by parameter exactly.
const ALLOWED_SORT_VALUES = [
  'popularity.desc',
  'popularity.asc',
  'vote_average.desc',
  'release_date.desc',
];

// ─────────────────────────────────────────────
// Error Translator
// ─────────────────────────────────────────────
/**
 * Translates an axios/TMDB error into a clean ApiError.
 *
 * We never let raw TMDB errors bubble up to the client because:
 * 1. They may contain internal details (URLs with API keys in query strings)
 * 2. Their status codes don't always map to what we want (e.g. TMDB 34 = our 404)
 * 3. Network errors (ECONNREFUSED) have no status code at all
 *
 * @param {Error} error — axios error
 * @returns {ApiError}
 */
function handleTmdbError(error) {
  // TMDB responded with a non-2xx status
  if (error.response) {
    const status = error.response.status;

    if (status === 401) {
      // Log this server-side — it means the API key is wrong/missing
      console.error('TMDB authentication failed — check TMDB_API_KEY in .env');
      return new ApiError(500, 'Movie service configuration error');
    }

    if (status === 404) {
      return new ApiError(404, 'Movie not found');
    }

    // Any other TMDB error (429 rate limit, 500 server error, etc.)
    return new ApiError(502, 'Movie service is currently unavailable. Try again later.');
  }

  // Request was made but no response received (network error, timeout)
  if (error.request) {
    return new ApiError(502, 'Movie service is currently unavailable. Try again later.');
  }

  // Something else went wrong (bug in our code setting up the request)
  return new ApiError(500, 'An unexpected error occurred');
}

// ─────────────────────────────────────────────
// Service Methods
// ─────────────────────────────────────────────

/**
 * Fetches a paginated list of movies using TMDB's /discover/movie endpoint.
 * Supports genre filtering and sorting.
 *
 * Cached for 10 minutes per unique combination of (page + genre + sort).
 *
 * @param {object} options
 * @param {number} options.page      — page number (default 1)
 * @param {number} options.genre     — TMDB genre ID (optional)
 * @param {string} options.sort      — sort_by value (default 'popularity.desc')
 * @returns {object} { movies, pagination }
 */
async function getMovies({ page = 1, genre, sort = 'popularity.desc' } = {}) {
  // Validate sort value — fall back to default if invalid
  const sortBy = ALLOWED_SORT_VALUES.includes(sort) ? sort : 'popularity.desc';

  // Build a unique cache key for this specific combination of parameters.
  // Different pages or genres must not share a cache entry.
  const cacheKey = `discover:page=${page}:genre=${genre || 'all'}:sort=${sortBy}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached; // Return early — no TMDB call needed
  }

  try {
    const params = {
      page,
      sort_by: sortBy,
      'vote_count.gte': 50, // Filter out movies with too few votes
                             // (avoids obscure movies with inflated 10.0 ratings)
    };

    // Only add with_genres if a genre was specified
    // Passing with_genres=undefined causes a TMDB API error
    if (genre) {
      params.with_genres = genre;
    }

    const response = await tmdbClient.get('/discover/movie', { params });
    const { results, page: currentPage, total_pages, total_results } = response.data;

    const result = {
      movies: results.map(normalizeMovieSummary),
      pagination: {
        page: currentPage,
        totalPages: Math.min(total_pages, 500), // TMDB caps at 500 pages
        totalResults: total_results,
      },
    };

    cache.set(cacheKey, result, cache.TTL.DISCOVER);
    return result;
  } catch (error) {
    throw handleTmdbError(error);
  }
}

/**
 * Searches movies by title using TMDB's /search/movie endpoint.
 * Search results are NOT cached — queries are too varied and user-specific.
 *
 * @param {string} query  — search term
 * @param {number} page   — page number (default 1)
 * @returns {object} { movies, pagination }
 */
async function searchMovies(query, page = 1) {
  try {
    const response = await tmdbClient.get('/search/movie', {
      params: {
        query: query.trim(),
        page,
        include_adult: false, // Keep it family-friendly
      },
    });

    const { results, page: currentPage, total_pages, total_results } = response.data;

    return {
      movies: results.map(normalizeMovieSummary),
      pagination: {
        page: currentPage,
        totalPages: Math.min(total_pages, 500),
        totalResults: total_results,
      },
    };
  } catch (error) {
    throw handleTmdbError(error);
  }
}

/**
 * Fetches full details for a single movie.
 * Cached for 30 minutes per movie ID — detail data is stable.
 *
 * @param {number} movieId — TMDB movie ID
 * @returns {object}       — normalized movie detail object
 */
async function getMovieById(movieId) {
  const cacheKey = `movie:${movieId}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await tmdbClient.get(`/movie/${movieId}`);
    const normalized = normalizeMovieDetail(response.data);

    cache.set(cacheKey, normalized, cache.TTL.MOVIE_DETAILS);
    return normalized;
  } catch (error) {
    throw handleTmdbError(error);
  }
}

/**
 * Fetches the list of all TMDB movie genres.
 * Cached for 24 hours — genres essentially never change.
 *
 * @returns {Array} [{ id: 28, name: "Action" }, ...]
 */
async function getGenres() {
  const cacheKey = 'genres';

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await tmdbClient.get('/genre/movie/list');
    const genres = response.data.genres; // [{ id, name }, ...]

    cache.set(cacheKey, genres, cache.TTL.GENRES);
    return genres;
  } catch (error) {
    throw handleTmdbError(error);
  }
}

module.exports = { getMovies, searchMovies, getMovieById, getGenres };
