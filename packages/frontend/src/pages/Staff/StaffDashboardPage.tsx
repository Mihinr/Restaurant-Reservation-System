import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRestaurants } from '../../store/slices/restaurantSlice';
import {
  fetchWaitlistByRestaurant,
  updateWaitlistStatus,
  removeFromWaitlist,
} from '../../store/slices/waitlistSlice';
import {
  fetchReservations,
  updateReservation,
  cancelReservation,
  removeTableFromReservation,
} from '../../store/slices/reservationSlice';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { WaitlistEntry, isStaffOrAdmin, Reservation, SocketEvents } from '@restaurant-reservation/shared';
import { format, isToday } from 'date-fns';
import { restaurantService } from '../../services/restaurantService';
import { useSocket } from '../../context/SocketContext';
import { FormEvent } from 'react';

type TabType = 'today' | 'future' | 'past';
type WaitlistTabType = 'waiting' | 'notified' | 'seated';

export function StaffDashboardPage() {
  const dispatch = useAppDispatch();
  const { restaurants } = useAppSelector(state => state.restaurant);
  const { entries, isLoading, error } = useAppSelector(state => state.waitlist);
  const { reservations } = useAppSelector(state => state.reservation);
  const { user } = useAppSelector(state => state.auth);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [activeWaitlistTab, setActiveWaitlistTab] = useState<WaitlistTabType>('waiting');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    reservationDate: '',
    reservationTime: '',
    partySize: 0,
    customerName: '',
    customerPhone: '',
    specialRequests: '',
  });

  // Filter and categorize reservations
  const { todayReservations, futureReservations, pastReservations } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const past: Reservation[] = [];
    const todayRes: Reservation[] = [];
    const future: Reservation[] = [];

    reservations.filter(res => !selectedRestaurantId || res.restaurantId === selectedRestaurantId)
      .forEach(res => {
        const resDate = new Date(res.reservationDate);
        resDate.setHours(0, 0, 0, 0);

        if (resDate < today) {
          past.push(res);
        } else if (resDate >= tomorrow) {
          future.push(res);
        } else {
          todayRes.push(res);
        }
      });

    // Sorting
    todayRes.sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime());
    
    future.sort((a, b) => {
      const dateDiff = new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime();
    });

    past.sort((a, b) => {
      const dateDiff = new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.reservationTime).getTime() - new Date(a.reservationTime).getTime();
    });

    return { todayReservations: todayRes, futureReservations: future, pastReservations: past };
  }, [reservations, selectedRestaurantId]);

  const displayedReservations = useMemo(() => {
    if (activeTab === 'today') return todayReservations;
    if (activeTab === 'future') return futureReservations;
    return pastReservations;
  }, [activeTab, todayReservations, futureReservations, pastReservations]);

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchReservations());
  }, [dispatch]);

  useEffect(() => {
    if (selectedRestaurantId) {
      dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
    }
  }, [dispatch, selectedRestaurantId]);

  // Real-time updates
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleReservationChange = (_data: any) => {
      // Refresh reservations if the change is relevant (or just refresh all for simplicity/correctness)
      toast.success('Reservation updated');
      dispatch(fetchReservations());
      // Waitlist might be affected if tables logic is involved, but separate event usually.
    };
    
    const handleWaitlistChange = (data: any) => {
      if (selectedRestaurantId && data.restaurantId === selectedRestaurantId) {
         toast.success('Waitlist updated');
         dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
      }
    };

    socket.on(SocketEvents.RESERVATION_CREATED, handleReservationChange);
    socket.on(SocketEvents.RESERVATION_UPDATED, handleReservationChange);
    socket.on(SocketEvents.RESERVATION_CANCELLED, handleReservationChange);
    socket.on(SocketEvents.WAITLIST_JOINED, handleWaitlistChange);
    socket.on(SocketEvents.WAITLIST_UPDATED, handleWaitlistChange);
    socket.on(SocketEvents.WAITLIST_REMOVED, handleWaitlistChange);

    return () => {
      socket.off(SocketEvents.RESERVATION_CREATED, handleReservationChange);
      socket.off(SocketEvents.RESERVATION_UPDATED, handleReservationChange);
      socket.off(SocketEvents.RESERVATION_CANCELLED, handleReservationChange);
      socket.off(SocketEvents.WAITLIST_JOINED, handleWaitlistChange);
      socket.off(SocketEvents.WAITLIST_UPDATED, handleWaitlistChange);
      socket.off(SocketEvents.WAITLIST_REMOVED, handleWaitlistChange);
    };
  }, [socket, dispatch, selectedRestaurantId]);


  const handleUpdateStatus = async (entryId: string, status: WaitlistEntry['status']) => {
    const result = await dispatch(updateWaitlistStatus({ id: entryId, status }));
    if (updateWaitlistStatus.fulfilled.match(result)) {
      if (status === 'NOTIFIED') {
        toast.success('Customer notified successfully');
      } else if (status === 'SEATED') {
        toast.success('Customer seated successfully');
      }
      if (selectedRestaurantId) {
        dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
      }
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleRemove = async (entryId: string) => {
    const confirmed = await new Promise<boolean>(resolve => {
      toast(
        t => (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">
              Are you sure you want to remove this entry from the waitlist?
            </p>
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
        {
          duration: Infinity,
          id: 'confirm-remove',
        }
      );
    });

    if (confirmed) {
      const result = await dispatch(removeFromWaitlist(entryId));
      if (removeFromWaitlist.fulfilled.match(result)) {
        toast.success('Removed from waitlist successfully');
        if (selectedRestaurantId) {
          dispatch(fetchWaitlistByRestaurant(selectedRestaurantId));
        }
      }
    }
  };

  const handleEdit = (reservation: Reservation) => {
    // Prevent editing past reservations
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

    // Validate required fields
    if (!editForm.customerName || editForm.customerName.trim() === '') {
      toast.error('Customer name is required');
      return;
    }

    if (!editForm.customerPhone || editForm.customerPhone.trim() === '') {
      toast.error('Customer phone is required');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(editForm.reservationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Reservation date cannot be in the past');
      return;
    }

    // Validate party size against table capacity
    const tableIds =
      (editingReservation as any).tableIds ||
      (editingReservation.tableId ? [editingReservation.tableId] : []);
    if (tableIds.length > 0) {
      try {
        const tablesResponse = await restaurantService.getTablesByIds(tableIds);
        const tables = tablesResponse.data;
        const totalCapacity = tables.reduce(
          (sum: number, table: { capacity: number }) => sum + table.capacity,
          0
        );

        if (editForm.partySize > totalCapacity) {
          toast.error(
            `Party size (${editForm.partySize}) exceeds total table capacity (${totalCapacity})`
          );
          return;
        }
      } catch (error) {
        // If we can't fetch table info, continue with update (backend will validate)
        console.warn('Could not fetch table capacity information:', error);
      }
    }

    // Check for date/time conflicts with other reservations
    const hasDateChange =
      editForm.reservationDate !==
      format(new Date(editingReservation.reservationDate), 'yyyy-MM-dd');
    const hasTimeChange =
      editForm.reservationTime !== format(new Date(editingReservation.reservationTime), 'HH:mm');

    if (hasDateChange || hasTimeChange) {
      // Check if the new date/time conflicts with other reservations
      const conflictingReservation = reservations.find(res => {
        // Skip the current reservation
        if (res.id === editingReservation.id) return false;

        // Check if same restaurant
        if (selectedRestaurantId && res.restaurantId !== selectedRestaurantId) return false;
        if (!selectedRestaurantId && res.restaurantId !== editingReservation.restaurantId) return false;


        // Check if same date
        const resDate = format(new Date(res.reservationDate), 'yyyy-MM-dd');
        if (resDate !== editForm.reservationDate) return false;

        // Check if same time
        const resTime = format(new Date(res.reservationTime), 'HH:mm');
        if (resTime !== editForm.reservationTime) return false;

        // Check if reservation is active (not cancelled or completed)
        if (res.status === 'CANCELLED' || res.status === 'COMPLETED') return false;

        // Check if tables overlap
        const resTableIds = (res as any).tableIds || (res.tableId ? [res.tableId] : []);
        const hasTableOverlap = tableIds.some((id: string) => resTableIds.includes(id));

        return hasTableOverlap;
      });

      if (conflictingReservation) {
        toast.error(
          'This date and time conflicts with another reservation. Please choose a different date or time.'
        );
        return;
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
            <p className="font-semibold">Remove Table {tableNumber} from this reservation?</p>
            <p className="text-sm text-white">The other tables will remain reserved.</p>
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
        {
          duration: Infinity,
          id: 'confirm-remove-table',
        }
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
    // Prevent canceling past reservations
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

  const handleClearReservation = async (reservation: Reservation) => {
    const confirmed = await new Promise<boolean>(resolve => {
      toast(
        t => (
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Clear this table?</p>
            <p className="text-sm text-white">Guest has left and table is ready for next search.</p>
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
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        ),
        { duration: Infinity, id: 'confirm-clear-table' }
      );
    });

    if (confirmed) {
      const result = await dispatch(updateReservation({
        id: reservation.id,
        data: {
          status: 'COMPLETED',
          version: reservation.version,
        } as any
      }));
      if (updateReservation.fulfilled.match(result)) {
        toast.success('Table cleared and marked as completed');
        dispatch(fetchReservations());
      }
    }
  };

  const waitingEntries = entries
    .filter(e => e.status === 'WAITING')
    .sort((a, b) => a.position - b.position);
  const notifiedEntries = entries.filter(e => e.status === 'NOTIFIED');
  // Only show customers seated today
  const seatedEntries = entries.filter(
    e => e.status === 'SEATED' && isToday(new Date(e.updatedAt))
  );

  if (!user || !isStaffOrAdmin(user.role)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">
            You must be a staff member or administrator to access this page.
          </p>
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
          onChange={e => setSelectedRestaurantId(e.target.value)}
        >
          <option value="">Select a restaurant</option>
          {restaurants.map(restaurant => (
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
            
            {/* Waitlist Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-4 overflow-x-auto" aria-label="Waitlist Tabs">
                <button
                  onClick={() => setActiveWaitlistTab('waiting')}
                  className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                    activeWaitlistTab === 'waiting'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Waiting
                  {waitingEntries.length > 0 && (
                    <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {waitingEntries.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveWaitlistTab('notified')}
                  className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                    activeWaitlistTab === 'notified'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Notified
                  {notifiedEntries.length > 0 && (
                    <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {notifiedEntries.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveWaitlistTab('seated')}
                  className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                    activeWaitlistTab === 'seated'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Seated Today
                  {seatedEntries.length > 0 && (
                    <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {seatedEntries.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading waitlist...</div>
            ) : (
              <div className="space-y-4">
                {activeWaitlistTab === 'waiting' && (
                  <>
                    {waitingEntries.length === 0 ? (
                      <p className="text-gray-600 text-sm sm:text-base">No one waiting in the queue.</p>
                    ) : (
                      <div className="space-y-3">
                        {waitingEntries.map(entry => (
                          <div key={entry.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-lg sm:text-xl text-blue-600">
                                    #{entry.position}
                                  </span>
                                  <span className="font-semibold text-sm sm:text-base">{entry.name}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Party of {entry.partySize} • {entry.phoneNumber}
                                </p>
                                {(entry.reservationDate || entry.reservationTime) && (
                                   <p className="text-xs text-gray-500 font-medium">
                                     Pref: {entry.reservationDate ? format(new Date(entry.reservationDate), 'yyyy-MM-dd') : ''}
                                     {entry.reservationTime && ` at ${format(new Date(entry.reservationTime), 'HH:mm')}`}
                                   </p>
                                )}
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
                  </>
                )}

                {activeWaitlistTab === 'notified' && (
                  <>
                    {notifiedEntries.length === 0 ? (
                      <p className="text-gray-600 text-sm sm:text-base">No notified customers.</p>
                    ) : (
                      <div className="space-y-3">
                        {notifiedEntries.map(entry => (
                          <div
                            key={entry.id}
                            className="border border-yellow-200 rounded-lg p-3 sm:p-4 bg-yellow-50"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1">
                                <span className="font-semibold text-sm sm:text-base">{entry.name}</span>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Party of {entry.partySize} • {entry.phoneNumber}
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                  Notified at: {format(new Date(entry.updatedAt), 'HH:mm')}
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
                    )}
                  </>
                )}

                {activeWaitlistTab === 'seated' && (
                  <>
                    {seatedEntries.length === 0 ? (
                      <p className="text-gray-600 text-sm sm:text-base">No seated customers today.</p>
                    ) : (
                      <div className="space-y-3">
                        {seatedEntries.map(entry => (
                          <div
                            key={entry.id}
                            className="border border-green-200 rounded-lg p-3 sm:p-4 bg-green-50"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm sm:text-base">{entry.name}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs font-bold uppercase">
                                    Seated
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                  Party of {entry.partySize} • {entry.phoneNumber}
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                  Seated at: {format(new Date(entry.updatedAt), 'HH:mm')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="danger"
                                  className="text-xs sm:text-sm px-3 py-1"
                                  onClick={() => handleRemove(entry.id)}
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Reservations</h2>
            <>
              {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                  <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('today')}
                      className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                        activeTab === 'today'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Today
                      {todayReservations.length > 0 && (
                        <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {todayReservations.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('future')}
                      className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                        activeTab === 'future'
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Future
                      {futureReservations.length > 0 && (
                        <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {futureReservations.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('past')}
                      className={`py-3 px-4 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                        activeTab === 'past'
                          ? 'border-gray-500 text-gray-600'
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

                {/* Reservations List */}
                {displayedReservations.length === 0 ? (
                  <p className="text-gray-600 text-sm sm:text-base">
                    No {activeTab} reservations found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {displayedReservations.map(reservation => (
                      <div key={reservation.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
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
                                onChange={e =>
                                  setEditForm({ ...editForm, reservationDate: e.target.value })
                                }
                                required
                              />
                              <Input
                                type="time"
                                label="Time"
                                value={editForm.reservationTime}
                                onChange={e =>
                                  setEditForm({ ...editForm, reservationTime: e.target.value })
                                }
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
                                onChange={e =>
                                  setEditForm({ ...editForm, customerName: e.target.value })
                                }
                                required
                              />
                              <Input
                                label="Customer Phone"
                                value={editForm.customerPhone}
                                onChange={e =>
                                  setEditForm({ ...editForm, customerPhone: e.target.value })
                                }
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
                                onChange={e =>
                                  setEditForm({ ...editForm, specialRequests: e.target.value })
                                }
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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <div>
                                <p className="font-semibold text-sm sm:text-base">
                                  {reservation.reservationNumber}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {format(new Date(reservation.reservationDate), 'MMM dd, yyyy')} • {format(new Date(reservation.reservationTime), 'HH:mm')} • Party
                                  of {reservation.partySize}
                                </p>
                                <div className="mt-1">
                                  {((reservation as any).tableNumbers &&
                                    (reservation as any).tableNumbers.length > 0) ||
                                  reservation.tableNumber ? (
                                    <div className="flex flex-wrap gap-2">
                                      {(reservation as any).tableNumbers &&
                                      (reservation as any).tableNumbers.length > 0 ? (
                                        (reservation as any).tableNumbers.map(
                                          (tableNum: string, index: number) => {
                                            const tableId = (reservation as any).tableIds?.[index];
                                            const isPast = pastReservations.some(
                                              r => r.id === reservation.id
                                            );
                                            const canRemove =
                                              !isPast &&
                                              reservation.status !== 'CANCELLED' &&
                                              reservation.status !== 'COMPLETED' &&
                                              (reservation as any).tableNumbers &&
                                              (reservation as any).tableNumbers.length > 1;

                                            return (
                                              <span
                                                key={tableNum}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                                              >
                                                Table {tableNum}
                                                {canRemove && tableId && (
                                                  <button
                                                    onClick={() =>
                                                      handleRemoveTable(
                                                        reservation.id,
                                                        tableId,
                                                        tableNum
                                                      )
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
                                        <span className="text-gray-900 text-xs sm:text-sm">
                                          Table {reservation.tableNumber}
                                        </span>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="mt-2 space-y-1">
                                  {reservation.customerName && (
                                    <p className="text-xs sm:text-sm text-gray-700 font-medium">
                                      {reservation.customerName}
                                      {reservation.customerPhone && (
                                        <span className="text-gray-500 font-normal ml-2">
                                          ({reservation.customerPhone})
                                        </span>
                                      )}
                                    </p>
                                  )}
                                  {reservation.specialRequests && (
                                    <div className="bg-gray-50 border-l-2 border-blue-400 p-2 text-xs sm:text-sm text-gray-700 flex gap-2 italic">
                                      <span className="font-semibold not-italic">Requests:</span>
                                      <span>{reservation.specialRequests}</span>
                                    </div>
                                  )}
                                </div>
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
                            {reservation.status !== 'CANCELLED' &&
                              reservation.status !== 'COMPLETED' &&
                              !pastReservations.some(r => r.id === reservation.id) && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="secondary"
                                    onClick={() => handleEdit(reservation)}
                                    className="px-3 py-1 text-xs"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="danger"
                                    onClick={() => handleCancel(reservation.id)}
                                    className="px-3 py-1 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => handleClearReservation(reservation)}
                                    className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    Clear Table
                                  </Button>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
          </div>
        </>
      )}
    </div>
  );
}
