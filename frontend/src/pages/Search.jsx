import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { movieService } from '../services/movieService';
import MovieCard from '../components/MovieCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StateComponents';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Incrementing retryCount re-triggers the useEffect, so the user can
  // retry a failed search without modifying the query.
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!query) return;

    const controller = new AbortController();
    
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await movieService.searchMovies(query, 1, controller.signal);
        setMovies(result.data);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        }
        setError(err.response?.data?.error || 'Failed to fetch search results.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      controller.abort();
    };
  }, [query, retryCount]); // retryCount in deps: incrementing it replays the fetch

  if (!query) return <EmptyState title="Search Movies" message="Enter a movie title in the search bar above." />;
  if (loading) return <LoadingState message={`Searching for "${query}"...`} />;
  // onRetry increments retryCount → re-triggers the useEffect with same query
  if (error) return <ErrorState error={error} onRetry={() => setRetryCount(c => c + 1)} />;
  if (movies.length === 0) return <EmptyState title="No matches found" message={`We couldn't find any movies matching "${query}".`} />;

  return (
    <div className="py-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-white mb-6">
        Search Results for <span className="text-primary">"{query}"</span>
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
