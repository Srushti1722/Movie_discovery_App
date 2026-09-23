const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const movieController = require('../controllers/movieController');

/**
 * Movie Routes
 *
 * IMPORTANT: Order matters in Express routing.
 * '/search' and '/genres' must be defined BEFORE '/:id'.
 * Otherwise Express will try to match "search" and "genres" as a movie ID.
 *
 * Example:
 *   GET /api/movies/search  ← without this order, Express tries id = "search"
 *   GET /api/movies/genres  ← same problem
 *   GET /api/movies/:id     ← catches everything else
 */

// GET /api/movies?page=1&genre=28&sort=popularity.desc
router.get('/', asyncHandler(movieController.getMovies));

// GET /api/movies/genres
router.get('/genres', asyncHandler(movieController.getGenres));

// GET /api/movies/search?q=batman&page=1
router.get('/search', asyncHandler(movieController.searchMovies));

// GET /api/movies/:id
router.get('/:id', asyncHandler(movieController.getMovieById));

module.exports = router;
