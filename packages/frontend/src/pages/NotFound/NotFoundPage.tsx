import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export function NotFoundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
      <h1 className="text-4xl sm:text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8 text-sm sm:text-base">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/">
          <Button variant="primary">Go to Home</Button>
        </Link>
        <Link to="/search">
          <Button variant="secondary">Search Restaurants</Button>
        </Link>
      </div>
    </div>
  );
}

