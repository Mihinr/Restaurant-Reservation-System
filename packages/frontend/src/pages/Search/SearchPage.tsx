import { useState, FormEvent, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRestaurants, searchAvailability } from '../../store/slices/restaurantSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { format } from 'date-fns';

export function SearchPage() {
  const [searchCriteria, setSearchCriteria] = useState({
    restaurantId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '19:00',
    partySize: 2,
  });

  const dispatch = useAppDispatch();
  const { restaurants, availableTables, isLoading } = useAppSelector((state) => state.restaurant);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (searchCriteria.restaurantId) {
      dispatch(searchAvailability({ ...searchCriteria, restaurantId: searchCriteria.restaurantId }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Search for Available Tables</h1>
      <form onSubmit={handleSearch} className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchCriteria.restaurantId}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, restaurantId: e.target.value })}
              required
            >
              <option value="">Select a restaurant</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            type="date"
            label="Date"
            value={searchCriteria.date}
            onChange={(e) => setSearchCriteria({ ...searchCriteria, date: e.target.value })}
            required
          />
          <Input
            type="time"
            label="Time"
            value={searchCriteria.time}
            onChange={(e) => setSearchCriteria({ ...searchCriteria, time: e.target.value })}
            required
          />
          <Input
            type="number"
            label="Party Size"
            value={searchCriteria.partySize}
            onChange={(e) => setSearchCriteria({ ...searchCriteria, partySize: parseInt(e.target.value) })}
            min="1"
            required
          />
        </div>
        <Button type="submit" isLoading={isLoading} className="mt-4 w-full sm:w-auto">
          Search
        </Button>
      </form>

      {availableTables.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4">Available Tables</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableTables
              .filter((table) => table.available)
              .map((table) => (
                <div key={table.tableId} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="font-bold text-base sm:text-lg">Table {table.tableNumber}</h3>
                  <p className="text-sm sm:text-base">Capacity: {table.capacity}</p>
                  <p className="text-sm sm:text-base">Min Party: {table.minPartySize}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

