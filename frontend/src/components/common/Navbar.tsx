import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Trophy, LayoutDashboard, LogIn } from 'lucide-react';

export default function Navbar() {
  const { isAdmin } = useAuthStore();
  const location = useLocation();

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-blue-700">
          <Trophy size={22} />
          TTT Live
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm flex items-center gap-1 ${
              location.pathname === '/' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tournaments
          </Link>
          {isAdmin ? (
            <Link
              to="/admin"
              className={`text-sm flex items-center gap-1 ${
                location.pathname === '/admin' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard size={14} /> Admin
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-sm flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <LogIn size={14} /> Admin Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
