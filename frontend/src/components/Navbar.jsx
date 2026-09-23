import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Search, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500); // Wait 500ms after last keystroke
  
  const navigate = useNavigate();
  const location = useLocation();

  // Handle the debounced auto-search
  useEffect(() => {
    // Only auto-navigate if there is a query, OR if they clear the query while on the search page
    if (debouncedQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
    } else if (location.pathname === '/search' && debouncedQuery === '') {
      // If they backspaced everything while on the search page, navigate back home
      navigate('/');
    }
  }, [debouncedQuery, navigate, location.pathname]);

  // Handle manual Enter key press (bypasses debounce)
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="bg-surface sticky top-0 z-50 border-b border-slate-700 shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-primary hover:text-blue-400 transition-colors shrink-0">
          <Film className="w-6 h-6" />
          <span className="text-xl font-bold tracking-tight hidden sm:block">MovieDiscover</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full bg-background text-slate-200 border border-slate-600 rounded-full py-1.5 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Wishlist Link */}
        <Link 
          to="/wishlist" 
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors shrink-0"
        >
          <Heart className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Wishlist</span>
        </Link>

      </div>
    </nav>
  );
}
