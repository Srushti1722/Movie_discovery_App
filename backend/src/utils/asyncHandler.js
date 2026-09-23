/**
 * asyncHandler — wraps async route handlers to catch errors automatically.
 *
 * The problem it solves:
 * -----------------------
 * Express doesn't catch errors from async functions by default.
 * Without this wrapper, an async controller that throws will crash the process
 * silently (or trigger an UnhandledPromiseRejection warning).
 *
 * Without asyncHandler — you'd write this in EVERY controller:
 *   try {
 *     const data = await someAsyncThing();
 *     res.json(data);
 *   } catch (err) {
 *     next(err);
 *   }
 *
 * With asyncHandler — controllers are clean:
 *   router.get('/movies', asyncHandler(async (req, res) => {
 *     const data = await someAsyncThing();
 *     res.json(data);
 *   }));
 *
 * How it works:
 *   It wraps your async function in a Promise.
 *   If the promise rejects (throws), it automatically calls next(err),
 *   which triggers the central error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
