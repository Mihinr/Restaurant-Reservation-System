import { useState, FormEvent, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRestaurants } from '../../store/slices/restaurantSlice';
import { joinWaitlist, fetchWaitlistByRestaurant, fetchMyWaitlist } from '../../store/slices/waitlistSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { isStaffOrAdmin } from '@restaurant-reservation/shared';

export function WaitlistPage() {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [waitlistForm, setWaitlistForm] = useState({
    partySize: 2,
    name: '',
    phoneNumber: '',
  });
  const [showForm, setShowForm] = useState(false);

  const dispatch = useAppDispatch();
  const { restaurants } = useAppSelector((state) => state.restaurant);
  const { entries, myWaitlistEntries, isLoading, error } = useAppSelector((state) => state.waitlist);
  const { user } = useAppSelector((state) => state.auth);

  const isStaff = user && isStaffOrAdmin(user.role);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  // For customers: fetch their own waitlist entries
  useEffect(() => {
    if (!isStaff && user) {
      dispatch(fetchMyWaitlist());
    }
  }, [dispatch, isStaff, user]);

  // For staff/admin: fetch restaurant's waitlist when restaurant is selected
  useEffect(() => {
    if (isStaff && selectedRestaurantId) {
      dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
    }
  }, [dispatch, isStaff, selectedRestaurantId]);

  useEffect(() => {
    // Auto-fill from profile when form is shown
    if (showForm && user) {
      setWaitlistForm({
        partySize: 2,
        name: `${user.firstName} ${user.lastName}`.trim(),
        phoneNumber: user.phone || '',
      });
    }
  }, [showForm, user]);

  const handleJoinWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId) return;

    const result = await dispatch(
      joinWaitlist({
        restaurantId: selectedRestaurantId,
        partySize: waitlistForm.partySize,
        name: waitlistForm.name,
        phoneNumber: waitlistForm.phoneNumber,
      })
    );

    if (joinWaitlist.fulfilled.match(result)) {
      toast.success('Added to waitlist successfully');
      toast(`Your position in the waitlist: #${result.payload.position}`, {
        icon: 'ℹ️',
        duration: 5000,
      });
      setShowForm(false);
      setWaitlistForm({ partySize: 2, name: '', phoneNumber: '' });
      // Refresh waitlist based on user role
      if (isStaff) {
        dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
      } else {
        dispatch(fetchMyWaitlist());
      }
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Join Waitlist</h1>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedRestaurantId}
            onChange={(e) => {
              setSelectedRestaurantId(e.target.value);
              setShowForm(false);
            }}
          >
            <option value="">Select a restaurant</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        {selectedRestaurantId && !showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            Join Waitlist
          </Button>
        )}

        {showForm && selectedRestaurantId && (
          <form onSubmit={handleJoinWaitlist} className="mt-4 space-y-4">
            <Input
              type="number"
              label="Party Size"
              value={waitlistForm.partySize}
              onChange={(e) => setWaitlistForm({ ...waitlistForm, partySize: parseInt(e.target.value) })}
              min="1"
              required
            />
            <Input
              label="Your Name"
              value={waitlistForm.name}
              onChange={(e) => setWaitlistForm({ ...waitlistForm, name: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={waitlistForm.phoneNumber}
              onChange={(e) => setWaitlistForm({ ...waitlistForm, phoneNumber: e.target.value })}
              required
            />
            <div className="flex gap-3">
              <Button type="submit" isLoading={isLoading} className="flex-1">
                Join Waitlist
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* For customers: Show their own waitlist entries */}
      {!isStaff && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-bold mb-4">My Waitlist Entries</h2>
          {myWaitlistEntries.length === 0 ? (
            <p className="text-gray-600 text-sm sm:text-base">
              You don't have any active waitlist entries. Select a restaurant above to join a waitlist.
            </p>
          ) : (
            <div className="space-y-3">
              {myWaitlistEntries
                .filter((entry) => entry.status !== 'CANCELLED')
                .sort((a, b) => a.position - b.position)
                .map((entry) => {
                  const restaurant = restaurants.find((r) => r.id === entry.restaurantId);
                  return (
                    <div
                      key={entry.id}
                      className={`p-3 border rounded ${
                        entry.status === 'NOTIFIED'
                          ? 'border-yellow-400 bg-yellow-50'
                          : entry.status === 'SEATED'
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm sm:text-base">
                            {restaurant?.name || 'Restaurant'}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Party of {entry.partySize} • {entry.phoneNumber}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Status: <span className="font-semibold">{entry.status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm sm:text-base">#{entry.position}</p>
                          {entry.estimatedWaitTime && (
                            <p className="text-xs text-gray-600">~{entry.estimatedWaitTime} min</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* For staff/admin: Show restaurant's waitlist */}
      {isStaff && selectedRestaurantId && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Current Waitlist</h2>
          {entries.length === 0 ? (
            <p className="text-gray-600 text-sm sm:text-base">No one is currently on the waitlist for this restaurant.</p>
          ) : (
            <div className="space-y-3">
              {entries
                .filter((entry) => entry.status === 'WAITING')
                .sort((a, b) => a.position - b.position)
                .map((entry) => (
                  <div key={entry.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm sm:text-base">{entry.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Party of {entry.partySize} • {entry.phoneNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm sm:text-base">#{entry.position}</p>
                        {entry.estimatedWaitTime && (
                          <p className="text-xs text-gray-600">~{entry.estimatedWaitTime} min</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

