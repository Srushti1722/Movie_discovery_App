import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';

export default function MovieCard({ movie }) {
  // Use our custom hook to check if this movie is saved and toggle it
  const { isSaved, addMovie, removeMovie } = useWishlist();
  const saved = isSaved(movie.id || movie.movieId); // Handle both TMDB movies and Wishlist movies

  const handleWishlistToggle = (e) => {
    e.preventDefault(); // Prevent clicking the heart from navigating to the movie details page
    if (saved) {
      removeMovie(movie.id || movie.movieId);
    } else {
      addMovie({
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
        releaseDate: movie.releaseDate,
        rating: movie.rating
      });
    }
  };

  // Format the year from "YYYY-MM-DD"
  const year = movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A';

  return (
    <Link 
      to={`/movie/${movie.id || movie.movieId}`} 
      className="group bg-surface rounded-xl overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-300 relative flex flex-col h-full"
    >
      {/* Poster Image with fallback */}
      <div className="aspect-[2/3] w-full bg-slate-800 relative overflow-hidden">
        {movie.posterUrl ? (
          <img 
            src={movie.posterUrl} 
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm p-4 text-center">
            No Poster Available
          </div>
        )}
        
        {/* Wishlist Button Overlay */}
        <button 
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors z-10"
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-5 h-5 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
      </div>

      {/* Movie Details */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-white text-lg line-clamp-1 mb-1" title={movie.title}>
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-2 text-sm text-slate-400">
          <span>{year}</span>
          <div className="flex items-center gap-1 font-medium text-amber-400">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{(movie.rating ?? 0).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
