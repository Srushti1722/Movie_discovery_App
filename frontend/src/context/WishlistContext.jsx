import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { wishlistService } from '../services/wishlistService';

/**
 * WishlistContext
 *
 * WHY CONTEXT?
 * The wishlist needs to be shared across all components:
 *   - MovieCard (Heart icon, isSaved check)
 *   - MovieDetails (Add/Remove button)
 *   - Wishlist page (full list)
 *
 * Previously, every call to useWishlist() created its own isolated useState([]).
 * That meant MovieCard's isSaved() always checked an empty array — it could
 * never know what was actually saved.
 *
 * React Context gives us ONE shared array that all components read from.
 * When any component adds or removes a movie, every other component
 * instantly sees the change.
 */
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the wishlist from the backend and store it in the shared context.
  // useCallback ensures this function reference is stable (needed when
  // components pass it as a useEffect dependency).
  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wishlistService.getWishlist();
      setWishlist(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the wishlist once when the app first mounts.
  // This populates the shared state so Heart icons on the Home/Search
  // pages correctly reflect the user's saved movies immediately.
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addMovie = async (movie) => {
    try {
      await wishlistService.addMovie(movie);
      // Optimistic update: immediately reflect the addition in shared state
      // so all components using useWishlist() see the change instantly.
      setWishlist(prev => [{
        movieId: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
        releaseDate: movie.releaseDate,
        rating: movie.rating,
      }, ...prev]);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to add movie',
      };
    }
  };

  const removeMovie = async (movieId) => {
    // Optimistic update: remove from state immediately for instant UI response.
    // If the server call fails, re-fetch the source of truth to restore correct state.
    setWishlist(prev => prev.filter(item => item.movieId !== movieId));
    try {
      await wishlistService.removeMovie(movieId);
      return { success: true };
    } catch (err) {
      // Revert by fetching fresh data from the server
      fetchWishlist();
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to remove movie',
      };
    }
  };

  // Returns true if the given movieId is in the user's wishlist.
  // useCallback so this reference is stable across renders.
  const isSaved = useCallback(
    (movieId) => wishlist.some(item => item.movieId === movieId),
    [wishlist]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, loading, error, fetchWishlist, addMovie, removeMovie, isSaved }}>
      {children}
    </WishlistContext.Provider>
  );
}

/**
 * useWishlist — consume the shared wishlist context.
 *
 * Drop-in replacement for the old hook. Components import this exactly as before.
 * Throws a helpful error if used outside of WishlistProvider.
 */
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
