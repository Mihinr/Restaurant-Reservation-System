import { updateUserSchema } from '../user.validator';

describe('user validator', () => {
    it('should validate partial update', () => {
        const result = updateUserSchema.safeParse({ firstName: 'New' });
        expect(result.success).toBe(true);
    });

    it('should invalidate incorrect phone', () => {
        const result = updateUserSchema.safeParse({ phone: 'invalid' });
        expect(result.success).toBe(false);
    });

    it('should validate valid phone', () => {
        const result = updateUserSchema.safeParse({ phone: '+1234567890' });
        expect(result.success).toBe(true);
    });
});
