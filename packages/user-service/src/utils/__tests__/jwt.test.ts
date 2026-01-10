import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../jwt';

jest.mock('jsonwebtoken');
jest.mock('../../config/env', () => ({
    getEnvConfig: () => ({
        JWT_SECRET: 'access-secret',
        JWT_EXPIRES_IN: '1h',
        REFRESH_TOKEN_SECRET: 'refresh-secret',
        REFRESH_TOKEN_EXPIRES_IN: '7d',
    })
}));

describe('jwt utils', () => {
    const payload = { userId: 'u1', email: 't@t.com', role: 'CUSTOMER' as const };

    it('generateAccessToken should call sign', () => {
        (jwt.sign as jest.Mock).mockReturnValue('token');
        const result = generateAccessToken(payload);
        expect(result).toBe('token');
        expect(jwt.sign).toHaveBeenCalledWith(payload, 'access-secret', expect.any(Object));
    });

    it('generateRefreshToken should call sign with refresh secret', () => {
        (jwt.sign as jest.Mock).mockReturnValue('token');
        const result = generateRefreshToken(payload);
        expect(result).toBe('token');
        expect(jwt.sign).toHaveBeenCalledWith(payload, 'refresh-secret', expect.any(Object));
    });

    it('verifyAccessToken should call verify', () => {
        (jwt.verify as jest.Mock).mockReturnValue(payload);
        const result = verifyAccessToken('token');
        expect(result).toEqual(payload);
    });

    it('verifyAccessToken should throw on error', () => {
        (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error(); });
        expect(() => verifyAccessToken('token')).toThrow('Invalid or expired token');
    });

    it('verifyRefreshToken should call verify with refresh secret', () => {
        (jwt.verify as jest.Mock).mockReturnValue(payload);
        const result = verifyRefreshToken('token');
        expect(result).toEqual(payload);
    });

    it('verifyRefreshToken should throw on error', () => {
        (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error(); });
        expect(() => verifyRefreshToken('token')).toThrow('Invalid or expired refresh token');
    });
});
