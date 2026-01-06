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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Reservations</h1>
      {reservations.length === 0 ? (
        <p className="text-gray-600">You have no reservations yet.</p>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg">{reservation.reservationNumber}</h3>
              <p>Date: {format(new Date(reservation.reservationDate), 'MMM dd, yyyy')}</p>
              <p>Time: {format(new Date(reservation.reservationTime), 'HH:mm')}</p>
              <p>Party Size: {reservation.partySize}</p>
              <p>Status: {reservation.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

