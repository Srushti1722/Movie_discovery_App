/**
 * Anonymous User ID Generator
 *
 * This function ensures the current browser has a unique, persistent ID.
 * It checks localStorage for an existing ID. If none exists, it generates
 * a standard UUID (using the browser's native crypto API) and saves it.
 *
 * Why do this?
 * It allows us to implement personalized features (like a Wishlist)
 * without building a full authentication system (signup, login, JWTs).
 * The trade-off is that if the user clears their browsing data,
 * their wishlist is lost. For a fresher assignment, this is a highly
 * practical and impressive trade-off to explain.
 */
export function getUserId() {
  const STORAGE_KEY = 'movie_app_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);

  if (!userId) {
    // Generate a secure UUID (v4) natively supported in all modern browsers
    userId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
}
