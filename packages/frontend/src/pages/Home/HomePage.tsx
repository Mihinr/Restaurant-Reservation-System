import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export function HomePage() {
  return (
    <div className="text-center px-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
        Welcome to Restaurant Reservations
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
        Book your table at the best restaurants in town
      </p>
      <Link to="/search">
        <Button className="w-full sm:w-auto">Search Restaurants</Button>
      </Link>
    </div>
  );
}

