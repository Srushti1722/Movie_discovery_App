import { useEffect } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import MovieCard from '../components/MovieCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StateComponents';

export default function Wishlist() {
  const { wishlist, loading, error, fetchWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  if (loading && wishlist.length === 0) return <LoadingState message="Loading your wishlist..." />;
  if (error && wishlist.length === 0) return <ErrorState error={error} onRetry={fetchWishlist} />;
  
  if (wishlist.length === 0) {
    return (
      <EmptyState 
        title="Your wishlist is empty" 
        message="Movies you add to your wishlist will appear here." 
      />
    );
  }

  return (
    <div className="py-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-white mb-6">My Wishlist</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {wishlist.map(movie => (
          <MovieCard key={movie.movieId} movie={movie} />
        ))}
      </div>
    </div>
  );
}
