import { useState, FormEvent, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRestaurants } from '../../store/slices/restaurantSlice';
import { joinWaitlist, fetchWaitlistByRestaurant, fetchMyWaitlist, removeFromWaitlist, respondToNotification } from '../../store/slices/waitlistSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { isStaffOrAdmin, SocketEvents } from '@restaurant-reservation/shared';
import { useSocket } from '../../context/SocketContext';


export function WaitlistPage() {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [waitlistForm, setWaitlistForm] = useState({
    partySize: 2,
    name: '',
    phoneNumber: '',
    reservationDate: '',
    reservationTime: '',
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
        reservationDate: '',
        reservationTime: '',
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
        reservationDate: waitlistForm.reservationDate,
        reservationTime: waitlistForm.reservationTime,
      })
    );

    if (joinWaitlist.fulfilled.match(result)) {
      toast.success('Added to waitlist successfully');
      toast(`Your position in the waitlist: #${result.payload.position}`, {
        icon: 'ℹ️',
        duration: 5000,
      });
      setShowForm(false);
      setWaitlistForm({ partySize: 2, name: '', phoneNumber: '', reservationDate: '', reservationTime: '' });
      // Refresh waitlist based on user role
      if (isStaff) {
        dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
      } else {
        dispatch(fetchMyWaitlist());
      }
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!socket) return;

    const handleWaitlistChange = () => {
      // Refresh waitlist based on role/context
      if (isStaff && selectedRestaurantId) {
        dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
      } else if (!isStaff && user) {
        // For customers, refresh their list to show new position/status
        dispatch(fetchMyWaitlist());
      }
    };

    socket.on(SocketEvents.WAITLIST_JOINED, handleWaitlistChange);
    socket.on(SocketEvents.WAITLIST_UPDATED, handleWaitlistChange);
    socket.on(SocketEvents.WAITLIST_REMOVED, handleWaitlistChange);

    return () => {
      socket.off(SocketEvents.WAITLIST_JOINED, handleWaitlistChange);
      socket.off(SocketEvents.WAITLIST_UPDATED, handleWaitlistChange);
      socket.off(SocketEvents.WAITLIST_REMOVED, handleWaitlistChange);
    };
  }, [socket, dispatch, isStaff, selectedRestaurantId, user]);


  const handleCancelEntry = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold">
          Cancel this waitlist request?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
          >
            No
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await dispatch(removeFromWaitlist(id));
              toast.success('Waitlist entry cancelled');
              dispatch(fetchMyWaitlist());
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity, id: 'confirm-cancel-waitlist' });
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
             <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Preferred Date"
                value={waitlistForm.reservationDate}
                onChange={(e) => setWaitlistForm({ ...waitlistForm, reservationDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <Input
                type="time"
                label="Preferred Time"
                value={waitlistForm.reservationTime}
                onChange={(e) => setWaitlistForm({ ...waitlistForm, reservationTime: e.target.value })}
                required
              />
            </div>
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
                          {(entry.reservationDate || entry.reservationTime) && (
                             <p className="text-xs text-gray-500">
                               Pref: {entry.reservationDate ? new Date(entry.reservationDate).toLocaleDateString() : ''}
                               {entry.reservationTime && ` at ${new Date(entry.reservationTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                             </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Status: <span className="font-semibold">{entry.status}</span>
                          </p>
                          {entry.status === 'NOTIFIED' && (
                             <div className="mt-2 flex gap-2">
                                <Button
                                  className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                     await dispatch(respondToNotification({ id: entry.id, action: 'accept' }));
                                     toast.success('You have accepted the table!');
                                     dispatch(fetchMyWaitlist());
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700"
                                  onClick={async () => {
                                     await dispatch(respondToNotification({ id: entry.id, action: 'decline' }));
                                     toast.success('You have declined the table.');
                                     dispatch(fetchMyWaitlist());
                                  }}
                                >
                                  Decline
                                </Button>
                             </div>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div>
                              <p className="font-bold text-sm sm:text-base">#{entry.position}</p>
                              {entry.estimatedWaitTime && (
                                <p className="text-xs text-gray-600">~{entry.estimatedWaitTime} min</p>
                              )}
                          </div>
                          {entry.status === 'WAITING' && (
                              <Button 
                                variant="danger" 
                                className="text-xs px-2 py-1"
                                onClick={() => handleCancelEntry(entry.id)}
                              >
                                Cancel
                              </Button>
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

