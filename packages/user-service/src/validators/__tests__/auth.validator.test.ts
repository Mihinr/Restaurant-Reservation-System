import { registerSchema, loginSchema, refreshTokenSchema } from '../auth.validator';

describe('auth validator', () => {
    describe('registerSchema', () => {
        it('should validate valid data', () => {
            const data = { email: 't@t.com', password: 'password', firstName: 'F', lastName: 'L' };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should invalidate short password', () => {
            const data = { email: 't@t.com', password: 'short', firstName: 'F', lastName: 'L' };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should handle optional phone formats', () => {
             expect(registerSchema.safeParse({ email: 't@t.com', password: 'password123', firstName: 'F', lastName: 'L', phone: '+1234567890' }).success).toBe(true);
             expect(registerSchema.safeParse({ email: 't@t.com', password: 'password123', firstName: 'F', lastName: 'L', phone: '' }).success).toBe(true);
             expect(registerSchema.safeParse({ email: 't@t.com', password: 'password123', firstName: 'F', lastName: 'L', phone: 'invalid' }).success).toBe(false);
        });
    });

    describe('loginSchema', () => {
        it('should validate valid login', () => {
            const result = loginSchema.safeParse({ email: 't@t.com', password: 'p' });
            expect(result.success).toBe(true);
        });
    });

    describe('refreshTokenSchema', () => {
        it('should validate refresh token', () => {
            const result = refreshTokenSchema.safeParse({ refreshToken: 'token' });
            expect(result.success).toBe(true);
        });
    });
});
