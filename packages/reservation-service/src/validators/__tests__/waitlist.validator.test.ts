import { createWaitlistEntrySchema } from '../waitlist.validator';

describe('Waitlist Validators', () => {
  const validData = {
    restaurantId: '550e8400-e29b-41d4-a716-446655440000',
    partySize: 4,
    phoneNumber: '+1234567890',
    name: 'Alice'
  };

  it('should validate correct data', () => {
    const result = createWaitlistEntrySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail with invalid phone number', () => {
    const invalidData = { ...validData, phoneNumber: 'not-a-phone' };
    const result = createWaitlistEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail with non-positive party size', () => {
    const invalidData = { ...validData, partySize: 0 };
    const result = createWaitlistEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
