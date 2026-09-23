const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const movieRoutes = require('./routes/movies');
const wishlistRoutes = require('./routes/wishlist');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─────────────────────────────────────────────
// 1. CORS
// ─────────────────────────────────────────────
// CORS (Cross-Origin Resource Sharing) controls which origins can call our API.
// Without this, the browser blocks requests from localhost:5173 → localhost:5000.
//
// We read the allowed origin from an environment variable so it works in both
// development (Vite on :5173) and production (your deployed frontend URL)
// without changing code.
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-user-id'],
};
app.use(cors(corsOptions));

// ─────────────────────────────────────────────
// 2. Body Parsing
// ─────────────────────────────────────────────
// Parses incoming JSON request bodies so we can read req.body in controllers.
// The limit prevents excessively large payloads.
app.use(express.json({ limit: '10kb' }));

// ─────────────────────────────────────────────
// 3. Rate Limiting
// ─────────────────────────────────────────────
// Limits each IP to 100 requests per 15 minutes.
// This is a basic safeguard — not a production-grade DDoS defence,
// but it prevents a single client from hammering the server and exhausting
// our TMDB API quota.
//
// For a fresher project this is the right level — simple and functional.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // max requests per window per IP
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,  // sends RateLimit-* headers
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─────────────────────────────────────────────
// 4. Health Check
// ─────────────────────────────────────────────
// A simple endpoint to confirm the server is alive.
// Useful for:
//   - Checking if the server started correctly during development
//   - Load balancers and uptime monitors in production
// curl http://localhost:5000/api/health
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// ─────────────────────────────────────────────
// 5. Routes
// ─────────────────────────────────────────────
app.use('/api/movies', movieRoutes);
app.use('/api/wishlist', wishlistRoutes);

// ─────────────────────────────────────────────
// 6. 404 Handler for unknown routes
// ─────────────────────────────────────────────
// If a request doesn't match any route above, this catches it.
// Without this, Express returns an HTML "Cannot GET /xyz" page —
// inconsistent with our JSON API.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

// ─────────────────────────────────────────────
// 7. Central Error Handler
// ─────────────────────────────────────────────
// MUST be registered LAST — after all routes.
// Express identifies error handlers by their 4-parameter signature: (err, req, res, next)
app.use(errorHandler);

module.exports = app;
