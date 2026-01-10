import bcrypt from 'bcryptjs';
import { hashPassword, comparePassword } from '../password';

jest.mock('bcryptjs');

describe('password utils', () => {
    it('hashPassword should call bcrypt.hash', async () => {
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        const result = await hashPassword('pass');
        expect(result).toBe('hashed');
        expect(bcrypt.hash).toHaveBeenCalledWith('pass', 12);
    });

    it('comparePassword should call bcrypt.compare', async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        const result = await comparePassword('pass', 'hash');
        expect(result).toBe(true);
        expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hash');
    });
});
