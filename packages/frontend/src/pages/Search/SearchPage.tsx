import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  const [filters, setFilters] = useState({ city: '', state: '' });
  const [dateError, setDateError] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<TableAvailability[]>([]);
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
    dispatch(fetchRestaurants(filters.city || filters.state ? filters : undefined));
  }, [dispatch, filters.city, filters.state]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setDateError('Date must be today or in the future');
    } else {
      setDateError(null);
      setSearchCriteria({ ...searchCriteria, date: e.target.value });
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (dateError) return;
    if (searchCriteria.restaurantId) {
      await dispatch(searchAvailability({ ...searchCriteria, restaurantId: searchCriteria.restaurantId }));
      setSelectedTables([]);
      setShowReservationForm(false);
    }
  };

  useEffect(() => {
    if (availableTables.length > 0) {
      const hasAvailable = availableTables.some(t => t.available);
      if (!hasAvailable) {
        toast('No tables available for the selected date and time', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
    }
  }, [availableTables]);

  const uniqueCities = Array.from(new Set(restaurants.map((r) => r.city))).sort();
  const uniqueStates = Array.from(new Set(restaurants.map((r) => r.state))).sort();

  const handleTableSelect = (table: TableAvailability) => {
    setSelectedTables(prev => {
      const isSelected = prev.some(t => t.tableId === table.tableId);
      if (isSelected) {
        // Deselect
        const newSelection = prev.filter(t => t.tableId !== table.tableId);
        setShowReservationForm(newSelection.length > 0);
        return newSelection;
      } else {
        // Select
        const newSelection = [...prev, table];
        setShowReservationForm(true);
        return newSelection;
      }
    });
  };

  const handleCreateReservation = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedTables.length === 0 || !searchCriteria.restaurantId) {
      toast.error('Please select at least one table');
      return;
    }

    if (!reservationDetails.customerName || reservationDetails.customerName.trim() === '') {
      toast.error('Customer name is required');
      return;
    }

    if (!reservationDetails.customerPhone || reservationDetails.customerPhone.trim() === '') {
      toast.error('Customer phone is required');
      return;
    }

    const reservationData: {
      restaurantId: string;
      tableIds: string[];
      reservationDate: string;
      reservationTime: string;
      partySize: number;
      customerName: string;
      customerPhone: string;
      specialRequests?: string;
    } = {
      restaurantId: searchCriteria.restaurantId,
      tableIds: selectedTables.map(t => t.tableId),
      reservationDate: searchCriteria.date,
      reservationTime: searchCriteria.time,
      partySize: searchCriteria.partySize,
      customerName: reservationDetails.customerName.trim(),
      customerPhone: reservationDetails.customerPhone.trim(),
    };
    if (reservationDetails.specialRequests) {
      reservationData.specialRequests = reservationDetails.specialRequests;
    }
    const result = await dispatch(createReservation(reservationData));

    if (createReservation.fulfilled.match(result)) {
      toast.success('Reservation created successfully');
      navigate('/reservation');
    }
  };

  useEffect(() => {
    if (reservationError) {
      toast.error(reservationError);
    }
  }, [reservationError]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Search for Available Tables</h1>
      
      {/* Restaurant Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-4">
        <h2 className="text-lg font-semibold mb-3">Filter Restaurants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            >
              <option value="">All States</option>
              {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(filters.city || filters.state) && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setFilters({ city: '', state: '' })}
            className="mt-3 text-sm"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
          <p className="text-gray-600 text-sm sm:text-base">No restaurants found matching your filters.</p>
        </div>
      ) : (
        <form onSubmit={handleSearch} className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                value={searchCriteria.restaurantId}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, restaurantId: e.target.value })}
                required
              >
                <option value="">Select a restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} - {restaurant.city}, {restaurant.state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                  dateError ? 'border-red-500' : 'border-gray-300'
                }`}
                value={searchCriteria.date}
                onChange={handleDateChange}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
              {dateError && <p className="mt-1 text-xs sm:text-sm text-red-500">{dateError}</p>}
            </div>
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
      )}

      {availableTables.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4">Available Tables</h2>
          {selectedTables.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                {selectedTables.length} table{selectedTables.length > 1 ? 's' : ''} selected: {selectedTables.map(t => `Table ${t.tableNumber}`).join(', ')}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Total Capacity: {selectedTables.reduce((sum, t) => sum + t.capacity, 0)} people
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableTables
              .filter((table) => table.available)
              .map((table) => {
                const isSelected = selectedTables.some(t => t.tableId === table.tableId);
                return (
                  <div
                    key={table.tableId}
                    className={`bg-white p-4 rounded-lg shadow-md cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                        : 'border-transparent hover:shadow-lg hover:border-gray-300'
                    }`}
                    onClick={() => handleTableSelect(table)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTableSelect(table)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg">Table {table.tableNumber}</h3>
                        <p className="text-sm sm:text-base">Capacity: {table.capacity}</p>
                        <p className="text-sm sm:text-base">Min Party: {table.minPartySize}</p>
                        {isSelected && (
                          <p className="text-sm text-blue-600 font-medium mt-2">✓ Selected</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {showReservationForm && selectedTables.length > 0 && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Complete Your Reservation</h2>
          <form onSubmit={handleCreateReservation}>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Tables:</strong> {selectedTables.map(t => `Table ${t.tableNumber}`).join(', ')}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date:</strong> {format(new Date(searchCriteria.date), 'MMM dd, yyyy')} | <strong>Time:</strong>{' '}
                {searchCriteria.time} | <strong>Party Size:</strong> {searchCriteria.partySize}
              </p>
            </div>
            <Input
              label="Customer Name"
              value={reservationDetails.customerName}
              onChange={(e) =>
                setReservationDetails({ ...reservationDetails, customerName: e.target.value })
              }
              required
            />
            <Input
              label="Customer Phone"
              value={reservationDetails.customerPhone}
              onChange={(e) =>
                setReservationDetails({ ...reservationDetails, customerPhone: e.target.value })
              }
              required
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
            <div className="flex gap-3">
              <Button type="submit" isLoading={isCreatingReservation} className="flex-1">
                Confirm Reservation
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowReservationForm(false);
                  setSelectedTables([]);
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

