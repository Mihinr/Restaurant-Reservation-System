import { generateReservationNumber } from '../reservationNumber';

describe('reservationNumber utility', () => {
  it('should generate a string starting with RES-', () => {
    const num = generateReservationNumber();
    expect(num).toMatch(/^RES-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it('should generate unique numbers', () => {
    const num1 = generateReservationNumber();
    const num2 = generateReservationNumber();
    expect(num1).not.toBe(num2);
  });
});
