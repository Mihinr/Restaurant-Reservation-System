import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyWaitlist, respondToNotification } from '../../store/slices/waitlistSlice';
import { Button } from '../common/Button';
import { isStaffOrAdmin } from '@restaurant-reservation/shared';

export function WaitlistNotification() {
  const dispatch = useAppDispatch();
  const { myWaitlistEntries, isLoading } = useAppSelector(state => state.waitlist);
  const { user, token } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Fetch waitlist entries when customer logs in (not staff/admin)
    if (token && user && !isStaffOrAdmin(user.role)) {
      dispatch(fetchMyWaitlist());
      // Poll for updates every 10 seconds to catch notifications
      const interval = setInterval(() => {
        dispatch(fetchMyWaitlist());
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [dispatch, token, user]);

  // Find notified entries from customer's own waitlist
  const notifiedEntries = myWaitlistEntries.filter(entry => entry.status === 'NOTIFIED');

  // Show banner only if user is a customer, logged in, and has notified entries
  if (!token || !user || isStaffOrAdmin(user.role) || notifiedEntries.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-3 mb-4 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-sm sm:text-base">
            Your table is ready! You have {notifiedEntries.length} notification{notifiedEntries.length > 1 ? 's' : ''}.
          </p>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            You're next in line. Please accept or decline below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {notifiedEntries.map(entry => (
            <div key={entry.id} className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                className="text-xs sm:text-sm px-3 py-1 bg-green-500 text-white hover:bg-green-600"
                onClick={() => {
                  dispatch(respondToNotification({ id: entry.id, action: 'accept' })).then(() => {
                    dispatch(fetchMyWaitlist());
                    toast.success('You have been seated!');
                  });
                }}
                isLoading={isLoading}
              >
                Accept Position #{entry.position}
              </Button>
              <Button
                variant="secondary"
                className="text-xs sm:text-sm px-3 py-1 bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={() => {
                  dispatch(respondToNotification({ id: entry.id, action: 'decline' })).then(() => {
                    dispatch(fetchMyWaitlist());
                    toast.success('You have been moved back to the waitlist');
                  });
                }}
                isLoading={isLoading}
              >
                Decline
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

