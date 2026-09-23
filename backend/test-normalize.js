/**
 * Normalization unit test — run with: node test-normalize.js
 *
 * Tests our normalizeMovieSummary and normalizeMovieDetail functions
 * against realistic TMDB response shapes WITHOUT needing a live TMDB call.
 *
 * This is exactly the kind of targeted test a senior engineer would write
 * to verify the transformation logic in isolation.
 */

const { normalizeMovieSummary, normalizeMovieDetail } = require('./src/utils/normalizeMovie');

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ─────────────────────────────────────────────
// Realistic raw TMDB list movie object
// ─────────────────────────────────────────────
const rawListMovie = {
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression.',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
  release_date: '1999-10-15',
  vote_average: 8.431,
  vote_count: 26280,
  genre_ids: [18, 53, 35],
  adult: false,
  popularity: 45.32,
  video: false,
  original_language: 'en',
};

// ─────────────────────────────────────────────
// Realistic raw TMDB detail movie object
// ─────────────────────────────────────────────
const rawDetailMovie = {
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  tagline: 'Mischief. Mayhem. Soap.',
  overview: 'A ticking-time-bomb insomniac...',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
  release_date: '1999-10-15',
  vote_average: 8.431,
  vote_count: 26280,
  runtime: 139,
  status: 'Released',
  original_language: 'en',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
    { id: 35, name: 'Comedy' },
  ],
  // Fields we deliberately DO NOT expose
  budget: 63000000,
  revenue: 100853753,
  production_companies: [{ id: 508, name: 'Regency Enterprises' }],
  spoken_languages: [{ english_name: 'English', iso_639_1: 'en' }],
};

// ─────────────────────────────────────────────
// Edge case: movie with missing data
// ─────────────────────────────────────────────
const rawMovieWithMissingData = {
  id: 999,
  title: null,
  original_title: 'Original Title',
  overview: null,
  poster_path: null,
  backdrop_path: null,
  release_date: '',
  vote_average: 0,
  vote_count: 0,
  genre_ids: null,
};

// ─────────────────────────────────────────────
// Tests: normalizeMovieSummary
// ─────────────────────────────────────────────
console.log('\n📋 normalizeMovieSummary');
const summary = normalizeMovieSummary(rawListMovie);

assert(summary.id === 550, 'id is preserved');
assert(summary.title === 'Fight Club', 'title is correct');
assert(summary.rating === 8.4, 'rating is rounded to 1 decimal (8.431 → 8.4)');
assert(
  summary.posterUrl === 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  'posterUrl is correctly constructed'
);
assert(
  summary.backdropUrl === 'https://image.tmdb.org/t/p/w1280/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
  'backdropUrl uses w1280 size'
);
assert(summary.releaseDate === '1999-10-15', 'releaseDate is a string (not a Date object)');
assert(Array.isArray(summary.genreIds), 'genreIds is an array');
assert(summary.genreIds[0] === 18, 'genreIds contains correct IDs');

// Verify we don't expose fields that shouldn't be on the client
assert(summary.budget === undefined, 'budget is NOT in summary (not a TMDB list field)');
assert(summary.adult === undefined, 'adult flag is stripped from response');
assert(summary.popularity === undefined, 'popularity score is stripped');

// ─────────────────────────────────────────────
// Tests: normalizeMovieDetail
// ─────────────────────────────────────────────
console.log('\n🎬 normalizeMovieDetail');
const detail = normalizeMovieDetail(rawDetailMovie);

assert(detail.id === 550, 'id is preserved');
assert(detail.tagline === 'Mischief. Mayhem. Soap.', 'tagline is included in detail');
assert(detail.runtime === 139, 'runtime is correct');
assert(detail.voteCount === 26280, 'voteCount is included');
assert(Array.isArray(detail.genres), 'genres is an array');
assert(detail.genres[0] === 'Drama', 'genres contains name strings (not objects)');
assert(detail.genres.length === 3, 'all genre names extracted correctly');
assert(detail.status === 'Released', 'status is included');
assert(detail.originalLanguage === 'en', 'originalLanguage is included (camelCase)');

// Verify sensitive/unnecessary fields are stripped
assert(detail.budget === undefined, 'budget is stripped');
assert(detail.revenue === undefined, 'revenue is stripped');
assert(detail.production_companies === undefined, 'production_companies stripped');

// ─────────────────────────────────────────────
// Tests: edge cases (missing data)
// ─────────────────────────────────────────────
console.log('\n⚠️  Edge cases (missing/null data)');
const missing = normalizeMovieSummary(rawMovieWithMissingData);

assert(missing.title === 'Original Title', 'falls back to original_title when title is null');
assert(missing.posterUrl === null, 'posterUrl is null when poster_path is missing');
assert(missing.backdropUrl === null, 'backdropUrl is null when backdrop_path is missing');
assert(missing.rating === 0, 'rating defaults to 0 when vote_average is 0');
assert(missing.overview === '', 'overview defaults to empty string when null');
assert(Array.isArray(missing.genreIds), 'genreIds defaults to [] when genre_ids is null');
assert(missing.releaseDate === null, 'releaseDate is null when empty string');

// ─────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
