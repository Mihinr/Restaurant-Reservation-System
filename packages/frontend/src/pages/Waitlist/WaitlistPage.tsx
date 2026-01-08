import { useState, FormEvent, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRestaurants } from '../../store/slices/restaurantSlice';
import { joinWaitlist, fetchWaitlistByRestaurant } from '../../store/slices/waitlistSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

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
  const { entries, isLoading, error, currentEntry } = useAppSelector((state) => state.waitlist);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  useEffect(() => {
    if (selectedRestaurantId) {
      dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
    }
  }, [dispatch, selectedRestaurantId]);

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
      setShowForm(false);
      setWaitlistForm({ partySize: 2, name: '', phoneNumber: '' });
      dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
    }
  };

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
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {currentEntry && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 text-sm">
                  You've been added to the waitlist! Position: {currentEntry.position}
                </p>
              </div>
            )}
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

      {selectedRestaurantId && (
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

