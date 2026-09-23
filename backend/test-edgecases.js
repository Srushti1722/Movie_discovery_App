const assert = require('assert');
const { addToWishlist, removeFromWishlist } = require('./src/services/wishlistService');
const Wishlist = require('./src/models/Wishlist');

// ---------------------------------------------------------
// MOCKING THE DATABASE
// We mock Mongoose so we can test the service logic instantly 
// without needing a live MongoDB connection.
// ---------------------------------------------------------

Wishlist.create = async (data) => {
  // Simulate a MongoDB duplicate key error (adding a movie already in the wishlist)
  if (data.movieId === 999) {
    const err = new Error('MongoError: E11000 duplicate key error');
    err.code = 11000;
    throw err;
  }
  // Simulate successful creation
  return {
    toObject: () => ({ ...data, _id: 'fake_db_id', __v: 0, updatedAt: new Date() })
  };
};

Wishlist.findOneAndDelete = async (query) => {
  // Simulate movie not found in wishlist
  if (query.movieId === 404) return null;
  // Simulate successful deletion
  return { movieId: query.movieId, title: 'Deleted Movie' };
};

// ---------------------------------------------------------
// RUNNING THE TESTS
// ---------------------------------------------------------
async function runEdgeCaseTests() {
  console.log('🧪 Running Edge Case Tests for Wishlist Service...\n');
  let passed = 0;
  let failed = 0;

  // TEST 1: Data Sanitization
  try {
    const result = await addToWishlist('user123', { movieId: 1, title: 'Batman' });
    assert.strictEqual(result.movieId, 1);
    assert.strictEqual(result._id, undefined, 'Should strip _id');
    assert.strictEqual(result.__v, undefined, 'Should strip __v');
    console.log('✅ TEST 1 PASSED: Successfully strips internal MongoDB fields (_id, __v) before returning to frontend.');
    passed++;
  } catch (e) {
    console.error('❌ TEST 1 FAILED', e);
    failed++;
  }

  // TEST 2: Duplicate Addition
  try {
    await addToWishlist('user123', { movieId: 999, title: 'Duplicate Movie' });
    console.error('❌ TEST 2 FAILED: Expected an error to be thrown.');
    failed++;
  } catch (e) {
    if (e.code === 11000) {
      console.log('✅ TEST 2 PASSED: Duplicate wishlist additions correctly bubble up MongoDB 11000 errors to be caught by the errorHandler.');
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Wrong error thrown', e);
      failed++;
    }
  }

  // TEST 3: Deleting Non-Existent Movie
  try {
    await removeFromWishlist('user123', 404);
    console.error('❌ TEST 3 FAILED: Expected an ApiError to be thrown.');
    failed++;
  } catch (e) {
    if (e.statusCode === 404) {
      console.log('✅ TEST 3 PASSED: Removing a non-existent movie throws a clean 404 ApiError (Not Found).');
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Wrong error thrown', e);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed.`);
}

runEdgeCaseTests();
