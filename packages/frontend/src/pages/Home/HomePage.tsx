import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Restaurant Reservations</h1>
      <p className="text-xl text-gray-600 mb-8">
        Book your table at the best restaurants in town
      </p>
      <Link to="/search">
        <Button>Search Restaurants</Button>
      </Link>
    </div>
  );
}

