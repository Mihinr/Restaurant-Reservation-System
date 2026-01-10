export enum SocketEvents {
  RESERVATION_CREATED = 'reservation:created',
  RESERVATION_UPDATED = 'reservation:updated',
  RESERVATION_CANCELLED = 'reservation:cancelled',
  WAITLIST_JOINED = 'waitlist:joined',
  WAITLIST_UPDATED = 'waitlist:updated',
  WAITLIST_REMOVED = 'waitlist:removed',
  TABLE_AVAILABILITY_CHANGED = 'table:availability_changed'
}
