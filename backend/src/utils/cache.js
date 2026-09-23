/**
 * Simple In-Memory Cache
 *
 * Why not Redis?
 * --------------
 * Redis is a separate infrastructure process you have to install, run,
 * and manage. For this project the added complexity isn't justified.
 * A plain JavaScript Map works perfectly — it's fast (in-process memory),
 * requires zero setup, and is easy to understand.
 *
 * Trade-off to be aware of:
 * - This cache is per-process. If you run multiple server instances
 *   (e.g. for load balancing), each has its own cache. For this project
 *   that's fine. At scale, you'd switch to Redis.
 * - The cache is lost when the server restarts. That's acceptable — the
 *   data comes back from TMDB on the next request.
 *
 * Structure of each cache entry:
 * {
 *   data:      the cached value (anything),
 *   expiresAt: Date timestamp — when this entry becomes stale
 * }
 *
 * What we cache and why:
 * ┌─────────────────┬──────────┬────────────────────────────────────────┐
 * │ Data            │ Duration │ Reason                                 │
 * ├─────────────────┼──────────┼────────────────────────────────────────┤
 * │ Genre list      │ 24 hours │ Genres almost never change             │
 * │ Movie details   │ 30 min   │ Stable data; rating changes slowly     │
 * │ Discover/trend  │ 10 min   │ Trending shifts, but not every second  │
 * │ Search results  │ NOT      │ Too variable — different queries daily │
 * └─────────────────┴──────────┴────────────────────────────────────────┘
 */

const cache = new Map();

/**
 * Retrieves a cached value by key.
 * Returns null if the key doesn't exist or the entry has expired.
 *
 * @param {string} key
 * @returns {any|null}
 */
function get(key) {
  const entry = cache.get(key);

  if (!entry) return null;

  // Check if the cached data has expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key); // Clean up expired entry
    return null;
  }

  return entry.data;
}

/**
 * Stores a value in the cache with a TTL (time-to-live) in seconds.
 *
 * @param {string} key
 * @param {any}    data
 * @param {number} ttlSeconds  — how long to keep this entry
 */
function set(key, data, ttlSeconds) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Removes a specific key from the cache.
 * Useful if you know data has changed and want to force a fresh fetch.
 *
 * @param {string} key
 */
function del(key) {
  cache.delete(key);
}

// Cache duration constants — defined here so they're easy to find and adjust.
// Using seconds as the unit (consistent with HTTP Cache-Control conventions).
const TTL = {
  GENRES: 60 * 60 * 24,       // 24 hours
  MOVIE_DETAILS: 60 * 30,     // 30 minutes
  DISCOVER: 60 * 10,          // 10 minutes
};

module.exports = { get, set, del, TTL };
