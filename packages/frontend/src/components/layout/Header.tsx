import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export function Header() {
  const { user, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Restaurant Reservations
        </Link>
        <nav className="flex gap-4 items-center">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/search" className="hover:text-gray-300">Search</Link>
          {token ? (
            <>
              <Link to="/reservation" className="hover:text-gray-300">My Reservations</Link>
              <Link to="/profile" className="hover:text-gray-300">Profile</Link>
              <span className="text-gray-400">{user?.firstName}</span>
              <button onClick={handleLogout} className="hover:text-gray-300">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">Login</Link>
              <Link to="/register" className="hover:text-gray-300">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

