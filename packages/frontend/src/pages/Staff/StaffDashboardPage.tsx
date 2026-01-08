import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRestaurants } from '../../store/slices/restaurantSlice';
import { fetchWaitlistByRestaurant, updateWaitlistStatus, removeFromWaitlist } from '../../store/slices/waitlistSlice';
import { fetchReservations } from '../../store/slices/reservationSlice';
import { Button } from '../../components/common/Button';
import { WaitlistEntry } from '@restaurant-reservation/shared';
import { format } from 'date-fns';

export function StaffDashboardPage() {
  const dispatch = useAppDispatch();
  const { restaurants } = useAppSelector((state) => state.restaurant);
  const { entries, isLoading, error } = useAppSelector((state) => state.waitlist);
  const { reservations } = useAppSelector((state) => state.reservation);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchReservations());
  }, [dispatch]);

  useEffect(() => {
    if (selectedRestaurantId) {
      dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
    }
  }, [dispatch, selectedRestaurantId]);

  const handleUpdateStatus = async (entryId: string, status: WaitlistEntry['status']) => {
    const result = await dispatch(updateWaitlistStatus({ id: entryId, status }));
    if (updateWaitlistStatus.fulfilled.match(result)) {
      if (selectedRestaurantId) {
        dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
      }
    }
  };

  const handleRemove = async (entryId: string) => {
    if (window.confirm('Are you sure you want to remove this entry from the waitlist?')) {
      const result = await dispatch(removeFromWaitlist(entryId));
      if (removeFromWaitlist.fulfilled.match(result)) {
        if (selectedRestaurantId) {
          dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
        }
      }
    }
  };

  const waitingEntries = entries.filter((e) => e.status === 'WAITING').sort((a, b) => a.position - b.position);
  const notifiedEntries = entries.filter((e) => e.status === 'NOTIFIED');
  const seatedEntries = entries.filter((e) => e.status === 'SEATED');

  if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You must be a staff member or administrator to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Staff Dashboard</h1>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        Welcome, {user.firstName} {user.lastName} ({user.role})
      </p>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Restaurant</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          value={selectedRestaurantId}
          onChange={(e) => setSelectedRestaurantId(e.target.value)}
        >
          <option value="">Select a restaurant</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      {selectedRestaurantId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-800 mb-2">Waiting</h3>
              <p className="text-3xl font-bold text-blue-600">{waitingEntries.length}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Notified</h3>
              <p className="text-3xl font-bold text-yellow-600">{notifiedEntries.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-800 mb-2">Seated</h3>
              <p className="text-3xl font-bold text-green-600">{seatedEntries.length}</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Waitlist Management</h2>
            {isLoading ? (
              <div className="text-center py-8">Loading waitlist...</div>
            ) : error ? (
              <div className="text-red-500 text-sm sm:text-base">{error}</div>
            ) : waitingEntries.length === 0 ? (
              <p className="text-gray-600 text-sm sm:text-base">No one waiting in the queue.</p>
            ) : (
              <div className="space-y-3">
                {waitingEntries.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg sm:text-xl text-blue-600">#{entry.position}</span>
                          <span className="font-semibold text-sm sm:text-base">{entry.name}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Party of {entry.partySize} • {entry.phoneNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined: {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="text-xs sm:text-sm px-3 py-1"
                          onClick={() => handleUpdateStatus(entry.id, 'NOTIFIED')}
                        >
                          Notify
                        </Button>
                        <Button
                          variant="primary"
                          className="text-xs sm:text-sm px-3 py-1"
                          onClick={() => handleUpdateStatus(entry.id, 'SEATED')}
                        >
                          Seat
                        </Button>
                        <Button
                          variant="danger"
                          className="text-xs sm:text-sm px-3 py-1"
                          onClick={() => handleRemove(entry.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifiedEntries.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Notified Customers</h2>
              <div className="space-y-3">
                {notifiedEntries.map((entry) => (
                  <div key={entry.id} className="border border-yellow-200 rounded-lg p-3 sm:p-4 bg-yellow-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="font-semibold text-sm sm:text-base">{entry.name}</span>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Party of {entry.partySize} • {entry.phoneNumber}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          className="text-xs sm:text-sm px-3 py-1"
                          onClick={() => handleUpdateStatus(entry.id, 'SEATED')}
                        >
                          Seat Now
                        </Button>
                        <Button
                          variant="danger"
                          className="text-xs sm:text-sm px-3 py-1"
                          onClick={() => handleRemove(entry.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Today's Reservations</h2>
            {reservations.length === 0 ? (
              <p className="text-gray-600 text-sm sm:text-base">No reservations for today.</p>
            ) : (
              <div className="space-y-3">
                {reservations
                  .filter((res) => {
                    const resDate = new Date(res.reservationDate);
                    const today = new Date();
                    return resDate.toDateString() === today.toDateString();
                  })
                  .map((reservation) => (
                    <div key={reservation.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm sm:text-base">{reservation.reservationNumber}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {format(new Date(reservation.reservationTime), 'HH:mm')} • Party of{' '}
                            {reservation.partySize}
                          </p>
                          {reservation.customerName && (
                            <p className="text-xs sm:text-sm text-gray-600">{reservation.customerName}</p>
                          )}
                        </div>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs sm:text-sm font-medium ${
                            reservation.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : reservation.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : reservation.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

