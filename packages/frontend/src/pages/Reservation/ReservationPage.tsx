import { useEffect, useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchReservations, updateReservation, cancelReservation } from '../../store/slices/reservationSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { format } from 'date-fns';
import { Reservation } from '@restaurant-reservation/shared';

export function ReservationPage() {
  const dispatch = useAppDispatch();
  const { reservations, isLoading, error } = useAppSelector((state) => state.reservation);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    reservationDate: '',
    reservationTime: '',
    partySize: 0,
    customerName: '',
    customerPhone: '',
    specialRequests: '',
  });

  useEffect(() => {
    dispatch(fetchReservations());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      if (error.includes('rate limit') || error.includes('Too many requests')) {
        toast.error(error, {
          duration: 5000,
          icon: '⚠️',
        });
      } else {
        toast.error(error);
      }
    }
  }, [error]);

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setEditForm({
      reservationDate: format(new Date(reservation.reservationDate), 'yyyy-MM-dd'),
      reservationTime: format(new Date(reservation.reservationTime), 'HH:mm'),
      partySize: reservation.partySize,
      customerName: reservation.customerName || '',
      customerPhone: reservation.customerPhone || '',
      specialRequests: reservation.specialRequests || '',
    });
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;

    const result = await dispatch(
      updateReservation({
        id: editingReservation.id,
        data: {
          reservationDate: editForm.reservationDate,
          reservationTime: editForm.reservationTime,
          partySize: editForm.partySize,
          customerName: editForm.customerName || undefined,
          customerPhone: editForm.customerPhone || undefined,
          specialRequests: editForm.specialRequests || undefined,
          version: editingReservation.version,
        },
      })
    );

    if (updateReservation.fulfilled.match(result)) {
      toast.success('Reservation updated successfully');
      setEditingReservation(null);
      dispatch(fetchReservations());
    }
  };

  const handleCancel = async (id: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Are you sure you want to cancel this reservation?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
              >
                No
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          id: 'confirm-cancel',
        }
      );
    });
    
    if (confirmed) {
      const result = await dispatch(cancelReservation(id));
      if (cancelReservation.fulfilled.match(result)) {
        toast.success('Reservation cancelled successfully');
        dispatch(fetchReservations());
      }
    }
  };

  if (isLoading && reservations.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
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
              {editingReservation?.id === reservation.id ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <h3 className="font-bold text-base sm:text-lg mb-3">
                    Edit Reservation: {reservation.reservationNumber}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Date"
                      value={editForm.reservationDate}
                      onChange={(e) => setEditForm({ ...editForm, reservationDate: e.target.value })}
                      required
                    />
                    <Input
                      type="time"
                      label="Time"
                      value={editForm.reservationTime}
                      onChange={(e) => setEditForm({ ...editForm, reservationTime: e.target.value })}
                      required
                    />
                    <Input
                      type="number"
                      label="Party Size"
                      value={editForm.partySize}
                      onChange={(e) => setEditForm({ ...editForm, partySize: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                    <Input
                      label="Customer Name"
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    />
                    <Input
                      label="Customer Phone"
                      value={editForm.customerPhone}
                      onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      rows={3}
                      value={editForm.specialRequests}
                      onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" isLoading={isLoading} className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingReservation(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">
                    {reservation.reservationNumber}
                  </h3>
                  {reservation.restaurantName && (
                    <div className="mb-3 sm:mb-4">
                      <span className="text-gray-600 font-medium">Restaurant:</span>{' '}
                      <span className="text-gray-900 font-semibold">
                        {reservation.restaurantName}
                        {reservation.restaurantCity && reservation.restaurantState && (
                          <span className="font-normal">
                            {' - '}
                            {reservation.restaurantCity}, {reservation.restaurantState}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base mb-4">
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
                    {reservation.tableNumber && (
                      <div>
                        <span className="text-gray-600 font-medium">Table:</span>{' '}
                        <span className="text-gray-900">{reservation.tableNumber}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600 font-medium">Status:</span>{' '}
                      <span className="text-gray-900 capitalize">{reservation.status.toLowerCase()}</span>
                    </div>
                    {reservation.customerName && (
                      <div>
                        <span className="text-gray-600 font-medium">Name:</span>{' '}
                        <span className="text-gray-900">{reservation.customerName}</span>
                      </div>
                    )}
                    {reservation.customerPhone && (
                      <div>
                        <span className="text-gray-600 font-medium">Phone:</span>{' '}
                        <span className="text-gray-900">{reservation.customerPhone}</span>
                      </div>
                    )}
                    {reservation.specialRequests && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-600 font-medium">Special Requests:</span>{' '}
                        <span className="text-gray-900">{reservation.specialRequests}</span>
                      </div>
                    )}
                  </div>
                  {reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED' && (
                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="secondary"
                        onClick={() => handleEdit(reservation)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleCancel(reservation.id)}
                        isLoading={isLoading}
                        className="flex-1"
                      >
                        Cancel Reservation
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

