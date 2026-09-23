import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      
      {/* The Outlet is where React Router renders our current page */}
      <main className="flex-1 container mx-auto px-4 w-full">
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-slate-500 text-sm mt-8 border-t border-slate-700/50">
        &copy; {new Date().getFullYear()} Movie Discovery App. Fresher Technical Assignment.
      </footer>
    </div>
  );
}
