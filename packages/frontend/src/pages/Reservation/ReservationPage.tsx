import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchReservations } from '../../store/slices/reservationSlice';
import { format } from 'date-fns';

export function ReservationPage() {
  const dispatch = useAppDispatch();
  const { reservations, isLoading } = useAppSelector((state) => state.reservation);

  useEffect(() => {
    dispatch(fetchReservations());
  }, [dispatch]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">My Reservations</h1>
      {reservations.length === 0 ? (
        <p className="text-gray-600 text-sm sm:text-base">You have no reservations yet.</p>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">
                {reservation.reservationNumber}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base">
                <div>
                  <span className="text-gray-600 font-medium">Date:</span>{' '}
                  <span className="text-gray-900">
                    {format(new Date(reservation.reservationDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Time:</span>{' '}
                  <span className="text-gray-900">
                    {format(new Date(reservation.reservationTime), 'HH:mm')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Party Size:</span>{' '}
                  <span className="text-gray-900">{reservation.partySize}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Status:</span>{' '}
                  <span className="text-gray-900 capitalize">{reservation.status.toLowerCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

