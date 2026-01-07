import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRestaurants, searchAvailability } from '../../store/slices/restaurantSlice';
import { createReservation } from '../../store/slices/reservationSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { format } from 'date-fns';
import { TableAvailability } from '@restaurant-reservation/shared';

export function SearchPage() {
  const [searchCriteria, setSearchCriteria] = useState({
    restaurantId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '19:00',
    partySize: 2,
  });
  const [selectedTable, setSelectedTable] = useState<TableAvailability | null>(null);
  const [reservationDetails, setReservationDetails] = useState({
    customerName: '',
    customerPhone: '',
    specialRequests: '',
  });
  const [showReservationForm, setShowReservationForm] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { restaurants, availableTables, isLoading } = useAppSelector((state) => state.restaurant);
  const { isLoading: isCreatingReservation, error: reservationError } = useAppSelector(
    (state) => state.reservation
  );

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (searchCriteria.restaurantId) {
      dispatch(searchAvailability({ ...searchCriteria, restaurantId: searchCriteria.restaurantId }));
      setSelectedTable(null);
      setShowReservationForm(false);
    }
  };

  const handleTableSelect = (table: TableAvailability) => {
    setSelectedTable(table);
    setShowReservationForm(true);
  };

  const handleCreateReservation = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !searchCriteria.restaurantId) return;

    const result = await dispatch(
      createReservation({
        restaurantId: searchCriteria.restaurantId,
        tableId: selectedTable.tableId,
        reservationDate: searchCriteria.date,
        reservationTime: searchCriteria.time,
        partySize: searchCriteria.partySize,
        customerName: reservationDetails.customerName || undefined,
        customerPhone: reservationDetails.customerPhone || undefined,
        specialRequests: reservationDetails.specialRequests || undefined,
      })
    );

    if (createReservation.fulfilled.match(result)) {
      navigate('/reservation');
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
                <div
                  key={table.tableId}
                  className={`bg-white p-4 rounded-lg shadow-md cursor-pointer transition-all ${
                    selectedTable?.tableId === table.tableId
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => handleTableSelect(table)}
                >
                  <h3 className="font-bold text-base sm:text-lg">Table {table.tableNumber}</h3>
                  <p className="text-sm sm:text-base">Capacity: {table.capacity}</p>
                  <p className="text-sm sm:text-base">Min Party: {table.minPartySize}</p>
                  {selectedTable?.tableId === table.tableId && (
                    <p className="text-sm text-blue-600 font-medium mt-2">Selected</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {showReservationForm && selectedTable && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Complete Your Reservation</h2>
          <form onSubmit={handleCreateReservation}>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Table:</strong> {selectedTable.tableNumber} | <strong>Date:</strong>{' '}
                {format(new Date(searchCriteria.date), 'MMM dd, yyyy')} | <strong>Time:</strong>{' '}
                {searchCriteria.time} | <strong>Party Size:</strong> {searchCriteria.partySize}
              </p>
            </div>
            <Input
              label="Customer Name (optional)"
              value={reservationDetails.customerName}
              onChange={(e) =>
                setReservationDetails({ ...reservationDetails, customerName: e.target.value })
              }
            />
            <Input
              label="Customer Phone (optional)"
              value={reservationDetails.customerPhone}
              onChange={(e) =>
                setReservationDetails({ ...reservationDetails, customerPhone: e.target.value })
              }
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                rows={3}
                value={reservationDetails.specialRequests}
                onChange={(e) =>
                  setReservationDetails({ ...reservationDetails, specialRequests: e.target.value })
                }
              />
            </div>
            {reservationError && <p className="text-red-500 mb-4 text-sm">{reservationError}</p>}
            <div className="flex gap-3">
              <Button type="submit" isLoading={isCreatingReservation} className="flex-1">
                Confirm Reservation
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowReservationForm(false);
                  setSelectedTable(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

