import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export function Header() {
  const { user, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl sm:text-2xl font-bold">
            Restaurant Reservations
          </Link>
          <button
            className="md:hidden p-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <nav className="hidden md:flex gap-4 items-center">
            <Link to="/" className="hover:text-gray-300 transition-colors">
              Home
            </Link>
            <Link to="/search" className="hover:text-gray-300 transition-colors">
              Search
            </Link>
            {token ? (
              <>
                <Link to="/reservation" className="hover:text-gray-300 transition-colors">
                  My Reservations
                </Link>
                <Link to="/profile" className="hover:text-gray-300 transition-colors">
                  Profile
                </Link>
                <span className="text-gray-400 text-sm">{user?.firstName}</span>
                <button onClick={handleLogout} className="hover:text-gray-300 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-300 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="hover:text-gray-300 transition-colors">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-2 space-y-2">
            <Link
              to="/"
              className="block py-2 hover:text-gray-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/search"
              className="block py-2 hover:text-gray-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Search
            </Link>
            {token ? (
              <>
                <Link
                  to="/reservation"
                  className="block py-2 hover:text-gray-300 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Reservations
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 hover:text-gray-300 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <div className="py-2 text-gray-400 text-sm">{user?.firstName}</div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 hover:text-gray-300 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 hover:text-gray-300 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 hover:text-gray-300 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

