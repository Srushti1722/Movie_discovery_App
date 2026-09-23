const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string from environment variables.
 *
 * Why a separate function instead of connecting inline in server.js?
 * - Keeps server.js clean and readable.
 * - Makes it easy to mock in tests.
 * - Centralizes the connection logic — if we ever change databases,
 *   there's exactly one place to update.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // Fail loudly at startup rather than mysteriously later.
    // A missing DB connection string is always a configuration mistake,
    // not a recoverable runtime error.
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Exit the process so the error is visible immediately.
    // An app running without a database is broken — there's no point
    // in keeping it alive.
    process.exit(1);
  }
}

module.exports = connectDB;
