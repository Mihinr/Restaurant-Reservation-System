import { useEffect, useState, FormEvent, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchReservations,
  updateReservation,
  cancelReservation,
  removeTableFromReservation,
} from '../../store/slices/reservationSlice';
import { fetchMyWaitlist, removeFromWaitlist } from '../../store/slices/waitlistSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { format } from 'date-fns';
import { Reservation } from '@restaurant-reservation/shared';
import { restaurantService } from '../../services/restaurantService';
import { SocketEvents } from '@restaurant-reservation/shared';
import { useSocket } from '../../context/SocketContext';

type TabType = 'current' | 'past' | 'waitlist';

export function ReservationPage() {
  const dispatch = useAppDispatch();
  const { reservations, isLoading, error } = useAppSelector(state => state.reservation);
  const { myWaitlistEntries } = useAppSelector(state => state.waitlist);
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    reservationDate: '',
    reservationTime: '',
    partySize: 0,
    customerName: '',
    customerPhone: '',
    specialRequests: '',
  });

  const { socket } = useSocket();

  useEffect(() => {
    dispatch(fetchReservations());
    dispatch(fetchMyWaitlist());
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;

    const handleReservationChange = (_data: any) => {
      dispatch(fetchReservations());
      toast.success('Your reservations have been updated');
    };

    socket.on(SocketEvents.RESERVATION_CREATED, handleReservationChange);
    socket.on(SocketEvents.RESERVATION_UPDATED, handleReservationChange);
    socket.on(SocketEvents.RESERVATION_CANCELLED, handleReservationChange);

    return () => {
      socket.off(SocketEvents.RESERVATION_CREATED, handleReservationChange);
      socket.off(SocketEvents.RESERVATION_UPDATED, handleReservationChange);
      socket.off(SocketEvents.RESERVATION_CANCELLED, handleReservationChange);
    };
  }, [socket, dispatch]);

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
    const now = new Date();
    const reservationDate = new Date(reservation.reservationDate);
    const reservationTime = new Date(reservation.reservationTime);
    const reservationDateTime = new Date(
      reservationDate.getFullYear(),
      reservationDate.getMonth(),
      reservationDate.getDate(),
      reservationTime.getHours(),
      reservationTime.getMinutes()
    );
    const durationMinutes = reservation.durationMinutes || 90;
    const reservationEndDateTime = new Date(
      reservationDateTime.getTime() + durationMinutes * 60 * 1000
    );

    if (reservationEndDateTime < now) {
      toast.error('Cannot edit past reservations');
      return;
    }

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

    if (!editForm.customerName || editForm.customerName.trim() === '') {
      toast.error('Customer name is required');
      return;
    }

    if (!editForm.customerPhone || editForm.customerPhone.trim() === '') {
      toast.error('Customer phone is required');
      return;
    }

    const selectedDate = new Date(editForm.reservationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Reservation date cannot be in the past');
      return;
    }

    const tableIds = (editingReservation as any).tableIds || (editingReservation.tableId ? [editingReservation.tableId] : []);
    if (tableIds.length > 0) {
      try {
        const tablesResponse = await restaurantService.getTablesByIds(tableIds);
        const tables = tablesResponse.data;
        const totalCapacity = tables.reduce((sum: number, table: { capacity: number }) => sum + table.capacity, 0);

        if (editForm.partySize > totalCapacity) {
          toast.error(`Party size (${editForm.partySize}) exceeds total table capacity (${totalCapacity})`);
          return;
        }
      } catch (error) {
        console.warn('Could not fetch table capacity information:', error);
      }
    }

    const result = await dispatch(
      updateReservation({
        id: editingReservation.id,
        data: {
          reservationDate: editForm.reservationDate,
          reservationTime: editForm.reservationTime,
          partySize: editForm.partySize,
          customerName: editForm.customerName.trim(),
          customerPhone: editForm.customerPhone.trim(),
          ...(editForm.specialRequests ? { specialRequests: editForm.specialRequests } : {}),
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

  const handleRemoveTable = async (reservationId: string, tableId: string, tableNumber: string) => {
    const confirmed = await new Promise<boolean>(resolve => {
      toast(
        t => (
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Remove Table {tableNumber} from this reservation?</p>
            <p className="text-sm text-gray-200">The other tables will remain reserved.</p>
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
                Yes, Remove
              </button>
            </div>
          </div>
        ),
        { duration: Infinity, id: 'confirm-remove-table' }
      );
    });

    if (confirmed) {
      const result = await dispatch(removeTableFromReservation({ reservationId, tableId }));
      if (removeTableFromReservation.fulfilled.match(result)) {
        toast.success(`Table ${tableNumber} removed from reservation`);
        dispatch(fetchReservations());
      }
    }
  };

  const handleCancel = async (id: string) => {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      const now = new Date();
      const reservationDate = new Date(reservation.reservationDate);
      const reservationTime = new Date(reservation.reservationTime);
      const reservationDateTime = new Date(
        reservationDate.getFullYear(),
        reservationDate.getMonth(),
        reservationDate.getDate(),
        reservationTime.getHours(),
        reservationTime.getMinutes()
      );
      const durationMinutes = reservation.durationMinutes || 90;
      const reservationEndDateTime = new Date(
        reservationDateTime.getTime() + durationMinutes * 60 * 1000
      );

      if (reservationEndDateTime < now) {
        toast.error('Cannot cancel past reservations');
        return;
      }
    }

    const confirmed = await new Promise<boolean>(resolve => {
      toast(
        t => (
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Are you sure you want to cancel this reservation?</p>
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
        { duration: Infinity, id: 'confirm-cancel' }
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

  const handleCancelWaitlist = async (id: string) => {
    const confirmed = await new Promise<boolean>(resolve => {
      toast(
        t => (
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Cancel this waitlist request?</p>
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
        { duration: Infinity, id: 'confirm-cancel-waitlist' }
      );
    });

    if (confirmed) {
      const result = await dispatch(removeFromWaitlist(id));
      if (removeFromWaitlist.fulfilled.match(result)) {
        toast.success('Waitlist entry cancelled');
        dispatch(fetchMyWaitlist());
      }
    }
  };

  const { pastReservations, currentReservations } = useMemo(() => {
    const now = new Date();
    const past: Reservation[] = [];
    const current: Reservation[] = [];

    reservations.forEach(reservation => {
      const reservationDate = new Date(reservation.reservationDate);
      const reservationTime = new Date(reservation.reservationTime);
      const reservationDateTime = new Date(
        reservationDate.getFullYear(),
        reservationDate.getMonth(),
        reservationDate.getDate(),
        reservationTime.getHours(),
        reservationTime.getMinutes()
      );
      const durationMinutes = reservation.durationMinutes || 90;
      const reservationEndDateTime = new Date(
        reservationDateTime.getTime() + durationMinutes * 60 * 1000
      );

      if (reservationEndDateTime < now) {
        past.push(reservation);
      } else {
        current.push(reservation);
      }
    });

    past.sort((a, b) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime());
    current.sort((a, b) => new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime());

    return { pastReservations: past, currentReservations: current };
  }, [reservations]);

  const confirmedWaitlistEntries = useMemo(() => 
    myWaitlistEntries.filter(entry => entry.status === 'SEATED'),
    [myWaitlistEntries]
  );

  if (isLoading && reservations.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">My Reservations</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
              activeTab === 'current'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current
            {currentReservations.length > 0 && (
              <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {currentReservations.length}
              </span>
            )}
          </button>
           <button
            onClick={() => setActiveTab('waitlist')}
            className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
              activeTab === 'waitlist'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Waitlist Confirmed
            {confirmedWaitlistEntries.length > 0 && (
              <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {confirmedWaitlistEntries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
              activeTab === 'past'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past
            {pastReservations.length > 0 && (
              <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                {pastReservations.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="space-y-4">
        {/* Waitlist Tab Content */}
        {activeTab === 'waitlist' && (
          <>
            {confirmedWaitlistEntries.length === 0 ? (
              <p className="text-gray-600 text-sm sm:text-base">No confirmed waitlist entries.</p>
            ) : (
              confirmedWaitlistEntries.map(entry => (
                <div key={entry.id} className="bg-green-50 border border-green-200 p-4 sm:p-6 rounded-lg shadow-sm">
                  <h3 className="font-bold text-base sm:text-lg mb-2 text-green-800">Waitlist Confirmed</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm sm:text-base">
                    <div>
                      <span className="text-gray-600 font-medium">Party Size:</span>{' '}
                      <span className="text-gray-900">{entry.partySize}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Phone:</span>{' '}
                      <span className="text-gray-900">{entry.phoneNumber}</span>
                    </div>
                    {(entry.reservationDate || entry.reservationTime) && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-600 font-medium">Preference:</span>{' '}
                        <span className="text-gray-900">
                          {entry.reservationDate ? new Date(entry.reservationDate).toLocaleDateString() : ''}
                          {entry.reservationTime && ` at ${new Date(entry.reservationTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                        </span>
                      </div>
                    )}
                    <div className="sm:col-span-2 mt-2">
                      <span className="text-green-700 font-medium">
                        You have been accepted off the waitlist! Please head to the host stand.
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <Button
                      variant="danger"
                      onClick={() => handleCancelWaitlist(entry.id)}
                      className="w-full sm:w-auto"
                    >
                      Cancel Request
                    </Button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Current/Past Tab Content */}
        {(activeTab === 'current' || activeTab === 'past') && (
          <>
            {(activeTab === 'current' ? currentReservations : pastReservations).length === 0 ? (
              <p className="text-gray-600 text-sm sm:text-base">
                {activeTab === 'current' ? 'You have no current or upcoming reservations.' : 'You have no past reservations.'}
              </p>
            ) : (
              (activeTab === 'current' ? currentReservations : pastReservations).map(reservation => (
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
                          onChange={e => setEditForm({ ...editForm, reservationDate: e.target.value })}
                          required
                        />
                        <Input
                          type="time"
                          label="Time"
                          value={editForm.reservationTime}
                          onChange={e => setEditForm({ ...editForm, reservationTime: e.target.value })}
                          required
                        />
                        <Input
                          type="number"
                          label="Party Size"
                          value={editForm.partySize}
                          onChange={e =>
                            setEditForm({ ...editForm, partySize: parseInt(e.target.value) })
                          }
                          min="1"
                          required
                        />
                        <Input
                          label="Customer Name"
                          value={editForm.customerName}
                          onChange={e => setEditForm({ ...editForm, customerName: e.target.value })}
                          required
                        />
                        <Input
                          label="Customer Phone"
                          value={editForm.customerPhone}
                          onChange={e => setEditForm({ ...editForm, customerPhone: e.target.value })}
                          required
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
                          onChange={e => setEditForm({ ...editForm, specialRequests: e.target.value })}
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
                          <span className="text-gray-900 font-semibold text-green-700">
                            {reservation.restaurantName}
                            {reservation.restaurantCity && reservation.restaurantState && (
                              <span className="font-normal text-gray-600">
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
                        {((reservation as any).tableNumbers &&
                          (reservation as any).tableNumbers.length > 0) ||
                        reservation.tableNumber ? (
                          <div className="sm:col-span-2">
                            <span className="text-gray-600 font-medium">
                              Table
                              {(reservation as any).tableNumbers &&
                              (reservation as any).tableNumbers.length > 1
                                ? 's'
                                : ''}
                              :
                            </span>{' '}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(reservation as any).tableNumbers &&
                              (reservation as any).tableNumbers.length > 0 ? (
                                (reservation as any).tableNumbers.map(
                                  (tableNum: string, index: number) => {
                                    const tableId = (reservation as any).tableIds?.[index];
                                    const isPast = pastReservations.some(r => r.id === reservation.id);
                                    const canRemove =
                                      !isPast &&
                                      reservation.status !== 'CANCELLED' &&
                                      reservation.status !== 'COMPLETED' &&
                                      (reservation as any).tableNumbers &&
                                      (reservation as any).tableNumbers.length > 1;

                                    return (
                                      <span
                                        key={tableNum}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium"
                                      >
                                        Table {tableNum}
                                        {canRemove && tableId && (
                                          <button
                                            onClick={() =>
                                              handleRemoveTable(reservation.id, tableId, tableNum)
                                            }
                                            className="ml-1 text-red-600 hover:text-red-800 font-bold"
                                            title="Remove this table"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </span>
                                    );
                                  }
                                )
                              ) : (
                                <span className="text-gray-900">{reservation.tableNumber}</span>
                              )}
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <span className="text-gray-600 font-medium">Status:</span>{' '}
                          <span className="text-gray-900 capitalize">
                            {reservation.status.toLowerCase()}
                          </span>
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
                      {reservation.status !== 'CANCELLED' &&
                        reservation.status !== 'COMPLETED' &&
                        !pastReservations.some(r => r.id === reservation.id) && (
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
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
