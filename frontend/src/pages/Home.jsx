import { useState, useEffect, useCallback } from 'react';
import { movieService } from '../services/movieService';
import MovieCard from '../components/MovieCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StateComponents';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'popularity.asc', label: 'Least Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest Releases' },
];

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  
  // Filter & Sort State
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSort, setSelectedSort] = useState('popularity.desc');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Fetch genres once on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await movieService.getGenres();
        setGenres(data);
      } catch (err) {
        console.error("Failed to load genres:", err);
      }
    };
    fetchGenres();
  }, []);

  // Centralized fetch function handles both initial loads (or filter changes) and pagination appends
  const loadMovies = useCallback(async (pageNum, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    setError(null);
    
    try {
      const params = { 
        page: pageNum, 
        sort: selectedSort 
      };
      
      if (selectedGenre) {
        params.genre = selectedGenre;
      }

      const result = await movieService.getMovies(params);
      
      if (isLoadMore) {
        // Append new movies to the existing array
        setMovies(prev => [...prev, ...result.data]);
      } else {
        // Replace array for new filter/sort
        setMovies(result.data);
      }
      
      setTotalPages(result.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load trending movies.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedGenre, selectedSort]);

  // Whenever the selected genre or sort changes, reset to page 1 and fetch
  useEffect(() => {
    loadMovies(1, false);
  }, [selectedGenre, selectedSort, loadMovies]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      loadMovies(page + 1, true);
    }
  };

  if (loading && movies.length === 0) return <LoadingState message="Discovering trending movies..." />;
  if (error && movies.length === 0) return <ErrorState error={error} onRetry={() => loadMovies(1, false)} />;

  return (
    <div className="py-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Discover Movies</h1>
        
        {/* Controls: Filter and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="">All Genres</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select 
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {movies.length === 0 && !loading ? (
        <EmptyState title="No movies found" message="Try selecting a different genre." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map(movie => (
              <MovieCard key={`${movie.id}-${selectedSort}`} movie={movie} />
            ))}
          </div>

          {/* Load More Button */}
          {page < totalPages && (
            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
