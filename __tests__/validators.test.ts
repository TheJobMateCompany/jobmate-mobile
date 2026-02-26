import {
  decodeJwtPayload,
  isFileSizeValid,
  isNotEmpty,
  isTokenExpired,
  isValidEmail,
  validatePassword,
} from '../src/lib/validators';

jest.mock('../src/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('validators', () => {
  describe('isValidEmail', () => {
    it('returns true for valid emails', () => {
      expect(isValidEmail('john.doe@example.com')).toBe(true);
      expect(isValidEmail('  user+tag@domain.co.uk ')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('foo@bar')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts a strong password', () => {
      const result = validatePassword('Abcd1234');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns translated keys for weak password rules', () => {
      const result = validatePassword('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('auth.errors.passwordTooShort');
      expect(result.errors).toContain('auth.errors.passwordNeedsUppercase');
      expect(result.errors).toContain('auth.errors.passwordNeedsNumber');
    });
  });

  describe('isNotEmpty', () => {
    it('trims whitespace before checking', () => {
      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty('   hello   ')).toBe(true);
      expect(isNotEmpty('   ')).toBe(false);
    });
  });

  describe('decodeJwtPayload / isTokenExpired', () => {
    it('decodes a valid JWT payload', () => {
      const token = makeToken({ sub: 'u1', exp: 9999999999 });
      expect(decodeJwtPayload(token)).toEqual({ sub: 'u1', exp: 9999999999 });
    });

    it('returns null for malformed token', () => {
      expect(decodeJwtPayload('bad.token')).toBeNull();
      expect(decodeJwtPayload('totally-invalid')).toBeNull();
    });

    it('detects expiration correctly', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const pastExp = Math.floor(Date.now() / 1000) - 3600;

      const validToken = makeToken({ sub: 'u1', exp: futureExp });
      const expiredToken = makeToken({ sub: 'u1', exp: pastExp });

      expect(isTokenExpired(validToken)).toBe(false);
      expect(isTokenExpired(expiredToken)).toBe(true);
      expect(isTokenExpired('invalid')).toBe(true);
    });
  });

  describe('isFileSizeValid', () => {
    it('validates file size against max MB', () => {
      expect(isFileSizeValid(1 * 1024 * 1024, 10)).toBe(true);
      expect(isFileSizeValid(10 * 1024 * 1024, 10)).toBe(true);
      expect(isFileSizeValid(10 * 1024 * 1024 + 1, 10)).toBe(false);
    });
  });
});
