import { createReservationSchema, updateReservationSchema } from '../reservation.validator';

describe('Reservation Validators', () => {
  const validData = {
    restaurantId: '550e8400-e29b-41d4-a716-446655440000',
    tableIds: ['550e8400-e29b-41d4-a716-446655440001'],
    reservationDate: '2026-01-20',
    reservationTime: '18:00',
    partySize: 2,
    customerName: 'John Doe',
    customerPhone: '+1234567890'
  };

  describe('createReservationSchema', () => {
    it('should validate correct data', () => {
      const result = createReservationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle non-object input gracefully', () => {
        expect(createReservationSchema.safeParse(null).success).toBe(false);
        expect(createReservationSchema.safeParse(undefined).success).toBe(false);
        expect(createReservationSchema.safeParse("not an object").success).toBe(false);
    });

    it('should convert empty strings to undefined for optional fields', () => {
        const data = { ...validData, specialRequests: '', tableId: '' };
        const result = createReservationSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.specialRequests).toBeUndefined();
            expect(result.data.tableId).toBeUndefined();
        }
    });

    it('should fail if neither tableId nor tableIds provided', () => {
      const { tableIds, ...invalidData } = validData;
      const result = createReservationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid date format', () => {
      const invalidData = { ...validData, reservationDate: '20-01-2026' };
      const result = createReservationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid time format', () => {
      const invalidData = { ...validData, reservationTime: '6:00 PM' };
      const result = createReservationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateReservationSchema', () => {
    it('should validate partial update', () => {
      const partialData = { partySize: 4 };
      const result = updateReservationSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should handle non-object input gracefully', () => {
        expect(updateReservationSchema.safeParse(null).success).toBe(false);
    });

    it('should handle empty strings by converting to undefined', () => {
      const data = { customerName: '', specialRequests: '', customerPhone: '', tableId: '' };
      const result = updateReservationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerName).toBeUndefined();
        expect(result.data.specialRequests).toBeUndefined();
        expect(result.data.customerPhone).toBeUndefined();
        expect(result.data.tableId).toBeUndefined();
      }
    });

    it('should handle empty tableIds array', () => {
        const data = { tableIds: [] };
        const result = updateReservationSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.tableIds).toBeUndefined();
        }
    });
  });
});
