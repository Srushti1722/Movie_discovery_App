import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Star, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { movieService } from '../services/movieService';
import { useWishlist } from '../hooks/useWishlist';
import { LoadingState, ErrorState } from '../components/StateComponents';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSaved, addMovie, removeMovie } = useWishlist();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await movieService.getMovieById(id);
      setMovie(result.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load movie details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // Scroll to top when opening a new movie detail page
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <LoadingState message="Loading movie details..." />;
  if (error) return <ErrorState error={error} onRetry={fetchDetails} />;
  if (!movie) return null;

  const saved = isSaved(movie.id);
  const year = movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A';

  const handleWishlistToggle = () => {
    if (saved) {
      removeMovie(movie.id);
    } else {
      addMovie(movie);
    }
  };

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Poster */}
        <div className="w-full md:w-1/3 shrink-0">
          <div className="rounded-xl overflow-hidden shadow-2xl relative">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-auto block" />
            ) : (
              <div className="aspect-[2/3] w-full bg-slate-800 flex items-center justify-center">
                No Poster
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Info */}
        <div className="w-full md:w-2/3 flex flex-col">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{movie.title}</h1>
          {movie.tagline && <p className="text-xl text-slate-400 italic mb-6">"{movie.tagline}"</p>}

          <div className="flex flex-wrap items-center gap-6 mb-8 text-sm font-medium">
            <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">
              <Star className="w-5 h-5 fill-amber-400" />
              <span className="text-base">{(movie.rating ?? 0).toFixed(1)}</span>
              <span className="text-slate-500 font-normal ml-1">({movie.voteCount} votes)</span>
            </div>
            {movie.runtime > 0 && (
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-5 h-5 text-slate-500" />
                {movie.runtime} min
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-5 h-5 text-slate-500" />
              {year}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {movie.genres.map(genre => (
              <span key={genre} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-sm">
                {genre}
              </span>
            ))}
          </div>

          <div className="mb-10">
            <h3 className="text-xl font-semibold text-white mb-3">Overview</h3>
            <p className="text-slate-300 leading-relaxed text-lg">{movie.overview}</p>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <button
              onClick={handleWishlistToggle}
              className={`flex items-center gap-3 px-8 py-3 rounded-full font-semibold transition-all ${
                saved 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                  : 'bg-primary hover:bg-blue-600 text-white'
              }`}
            >
              <Heart className={`w-6 h-6 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
              {saved ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
