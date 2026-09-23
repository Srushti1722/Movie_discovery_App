/**
 * Movie Data Normalization
 *
 * TMDB returns raw API responses with inconsistent field names,
 * snake_case conventions, and many fields we don't need.
 *
 * These functions transform that raw shape into a clean, consistent
 * application-specific format. The frontend always gets the same shape
 * regardless of which TMDB endpoint was called.
 *
 * Why normalize?
 * ---------------
 * 1. If TMDB changes a field name, you fix it in ONE place here.
 * 2. The frontend doesn't need to know TMDB's conventions (snake_case, etc.)
 * 3. Posterity: if you switch from TMDB to another API, only this file changes.
 * 4. You can strip sensitive or unnecessary fields before they reach the client.
 *
 * TMDB Image URL construction:
 * Base URL: https://image.tmdb.org/t/p/
 * Sizes:    w200, w300, w500, w780, w1280, original
 * Example:  https://image.tmdb.org/t/p/w500/abc123.jpg
 */

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * Builds a full TMDB image URL from a path.
 * Returns null if no path is provided (some movies have no poster).
 *
 * @param {string|null} path  — e.g. "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
 * @param {string} size       — e.g. "w500", "w1280"
 * @returns {string|null}
 */
function buildImageUrl(path, size = 'w500') {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/**
 * Normalizes a movie from a LIST endpoint (discover, search).
 *
 * These endpoints return summary data — no tagline, runtime, or status.
 * Genre data is only IDs (e.g. [28, 12]) not names.
 * That's fine for a movie card — we only need poster, title, rating, year.
 *
 * @param {object} movie — raw TMDB movie object from a list response
 * @returns {object}     — clean normalized movie for list display
 */
function normalizeMovieSummary(movie) {
  return {
    id: movie.id,
    title: movie.title || movie.original_title || 'Untitled',
    overview: movie.overview || '',
    posterUrl: buildImageUrl(movie.poster_path, 'w500'),
    backdropUrl: buildImageUrl(movie.backdrop_path, 'w1280'),
    releaseDate: movie.release_date || null,
    // Round to one decimal: 8.431 → 8.4
    rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : 0,
    // Genre IDs — the frontend uses these to show genre tags.
    // Full genre names are available via GET /api/movies/genres.
    genreIds: movie.genre_ids || [],
  };
}

/**
 * Normalizes a movie from the DETAIL endpoint (/movie/:id).
 *
 * The detail endpoint returns the full movie object including:
 * - genres as objects [{ id: 28, name: "Action" }] instead of just IDs
 * - tagline, runtime, status, spoken_languages, production_companies, etc.
 *
 * We pick exactly what the detail page needs — nothing more.
 *
 * @param {object} movie — raw TMDB movie object from the detail endpoint
 * @returns {object}     — clean normalized movie for the detail page
 */
function normalizeMovieDetail(movie) {
  return {
    id: movie.id,
    title: movie.title || movie.original_title || 'Untitled',
    tagline: movie.tagline || null,
    overview: movie.overview || '',
    posterUrl: buildImageUrl(movie.poster_path, 'w500'),
    backdropUrl: buildImageUrl(movie.backdrop_path, 'w1280'),
    releaseDate: movie.release_date || null,
    rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : 0,
    voteCount: movie.vote_count || 0,
    // runtime is in minutes — null if not yet known (e.g. upcoming films)
    runtime: movie.runtime || null,
    // genres is an array of objects on the detail endpoint — extract just the names
    genres: (movie.genres || []).map((g) => g.name),
    status: movie.status || null,
    originalLanguage: movie.original_language || null,
  };
}

module.exports = { normalizeMovieSummary, normalizeMovieDetail, buildImageUrl };
