import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import MovieDetails from './pages/MovieDetails';
import Wishlist from './pages/Wishlist';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 'index' means this renders at the parent path "/" */}
        <Route index element={<Home />} />
        
        <Route path="search" element={<Search />} />
        
        {/* Dynamic route: matches /movie/123 -> id = "123" */}
        <Route path="movie/:id" element={<MovieDetails />} />
        
        <Route path="wishlist" element={<Wishlist />} />
        
        {/* 404 Catch-all */}
        <Route path="*" element={
          <div className="py-20 text-center">
            <h2 className="text-2xl text-slate-300">404 - Page Not Found</h2>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default App;
