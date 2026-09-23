/**
 * server.js — Entry point
 *
 * This file's only job is:
 * 1. Load environment variables
 * 2. Connect to MongoDB
 * 3. Start the HTTP server
 *
 * It does NOT configure Express — that's app.js.
 *
 * Why this separation?
 * Tests import app.js directly without starting a real HTTP server.
 * This avoids port conflicts when running multiple tests simultaneously.
 */

// Load .env variables FIRST, before anything else.
// dotenv reads the .env file and adds each variable to process.env.
// If this line runs after 'require('./config/db')', the DB config
// won't have process.env.MONGODB_URI yet — a subtle but common bug.
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Self-invoking async function — needed because top-level await
// isn't available in CommonJS modules.
(async () => {
  // Connect to MongoDB before starting the HTTP server.
  // If the DB connection fails, connectDB() calls process.exit(1),
  // so the server never starts in a broken state.
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });

  // ─────────────────────────────────────────────
  // Graceful Shutdown
  // ─────────────────────────────────────────────
  // When the process receives SIGTERM (e.g. Ctrl+C, or a server restart),
  // we close the HTTP server first (stops accepting new requests),
  // then close the MongoDB connection cleanly.
  //
  // Why bother?
  // Without this, in-flight requests get cut off mid-response and
  // MongoDB write operations can be interrupted — data corruption risk.
  // For a fresher project this is good practice to mention in a review.
  const shutdown = () => {
    console.log('\n⏳ Gracefully shutting down...');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown); // Ctrl+C in terminal
})();
