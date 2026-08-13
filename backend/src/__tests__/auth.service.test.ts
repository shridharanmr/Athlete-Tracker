/**
 * auth.service.test.ts
 *
 * Uses jest.spyOn on the actual singleton instances imported from repositories.
 * This is the correct pattern for ts-jest with `export default new Class()` singletons.
 */

process.env.JWT_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';

// Mock heavy dependencies that would cause side effects
jest.mock('../models/User.model', () => ({}));
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(undefined));

import { UserRole } from '../types';
import userRepository from '../repositories/user.repository';
import authService from '../services/auth.service';

// ─── Helper ───────────────────────────────────────────────────────────────────

const buildMockUser = (overrides: Record<string, unknown> = {}) => ({
  _id: { toString: () => 'user123' },
  username: 'testcoach',
  email: 'coach@test.com',
  role: UserRole.Coach,
  isActive: true,
  isLocked: false,
  loginAttempts: 0,
  lockUntil: undefined as Date | undefined,
  lastLogin: undefined as Date | undefined,
  refreshToken: undefined as string | undefined,
  matchPassword: jest.fn().mockResolvedValue(true),
  generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
  generatePasswordResetToken: jest.fn().mockReturnValue('raw_reset_token'),
  resetPasswordToken: undefined as string | undefined,
  resetPasswordExpire: undefined as Date | undefined,
  password: 'hashed',
  ...overrides,
});

// ─── AuthService.login ────────────────────────────────────────────────────────

describe('AuthService.login', () => {
  let findByUsernameSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    findByUsernameSpy = jest.spyOn(userRepository, 'findByUsername');
    saveSpy = jest.spyOn(userRepository, 'save');
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns token pair on successful login', async () => {
    const mockUser = buildMockUser();
    findByUsernameSpy.mockResolvedValue(mockUser as never);
    saveSpy.mockResolvedValue(mockUser as never);

    const result = await authService.login({ username: 'testcoach', password: 'password123' });

    expect(result.accessToken).toBe('mock_access_token');
    expect(result.refreshToken).toBe('mock_refresh_token');
    expect(result.user.username).toBe('testcoach');
    expect(result.user.role).toBe(UserRole.Coach);
  });

  it('throws when user is not found', async () => {
    findByUsernameSpy.mockResolvedValue(null as never);

    await expect(
      authService.login({ username: 'nobody', password: 'pass' })
    ).rejects.toThrow('Invalid username or password');
  });

  it('throws when password does not match', async () => {
    const mockUser = buildMockUser({ matchPassword: jest.fn().mockResolvedValue(false) });
    findByUsernameSpy.mockResolvedValue(mockUser as never);
    saveSpy.mockResolvedValue(mockUser as never);

    await expect(
      authService.login({ username: 'testcoach', password: 'wrongpass' })
    ).rejects.toThrow('Invalid username or password');
  });

  it('increments loginAttempts on failed password', async () => {
    const mockUser = buildMockUser({ matchPassword: jest.fn().mockResolvedValue(false) });
    findByUsernameSpy.mockResolvedValue(mockUser as never);
    saveSpy.mockResolvedValue(mockUser as never);

    try { await authService.login({ username: 'testcoach', password: 'wrong' }); } catch (_) {}

    expect(mockUser.loginAttempts).toBe(1);
    expect(saveSpy).toHaveBeenCalled();
  });

  it('locks account after 5 failed attempts', async () => {
    const mockUser = buildMockUser({
      loginAttempts: 4,
      matchPassword: jest.fn().mockResolvedValue(false),
    });
    findByUsernameSpy.mockResolvedValue(mockUser as never);
    saveSpy.mockResolvedValue(mockUser as never);

    try { await authService.login({ username: 'testcoach', password: 'wrong' }); } catch (_) {}

    expect(mockUser.lockUntil).toBeDefined();
    expect(mockUser.loginAttempts).toBe(0);
  });

  it('throws when account is locked', async () => {
    const mockUser = buildMockUser({
      isLocked: true,
      lockUntil: new Date(Date.now() + 5 * 60 * 1000),
    });
    findByUsernameSpy.mockResolvedValue(mockUser as never);

    await expect(
      authService.login({ username: 'testcoach', password: 'pass' })
    ).rejects.toThrow('Account locked');
  });

  it('throws when account is deactivated', async () => {
    const mockUser = buildMockUser({ isActive: false });
    findByUsernameSpy.mockResolvedValue(mockUser as never);

    await expect(
      authService.login({ username: 'testcoach', password: 'pass' })
    ).rejects.toThrow('deactivated');
  });

  it('resets loginAttempts on successful login', async () => {
    const mockUser = buildMockUser({ loginAttempts: 3 });
    findByUsernameSpy.mockResolvedValue(mockUser as never);
    saveSpy.mockResolvedValue(mockUser as never);

    await authService.login({ username: 'testcoach', password: 'password123' });

    expect(mockUser.loginAttempts).toBe(0);
    expect(mockUser.lastLogin).toBeDefined();
  });
});

// ─── AuthService.forgotPassword ───────────────────────────────────────────────

describe('AuthService.forgotPassword', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does not throw when email is not found (silent for security)', async () => {
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null as never);

    await expect(
      authService.forgotPassword('unknown@test.com', 'http://localhost:3000')
    ).resolves.toBeUndefined();
  });

  it('generates reset token and saves user when email exists', async () => {
    const mockUser = buildMockUser();
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser as never);
    const saveSpy = jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as never);

    await authService.forgotPassword('coach@test.com', 'http://localhost:3000');

    expect(mockUser.generatePasswordResetToken).toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalled();
  });
});

// ─── AuthService.updatePassword ───────────────────────────────────────────────

describe('AuthService.updatePassword', () => {
  afterEach(() => jest.restoreAllMocks());

  it('throws when current password is incorrect', async () => {
    const mockUser = buildMockUser({ matchPassword: jest.fn().mockResolvedValue(false) });
    jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser as never);

    await expect(
      authService.updatePassword('user123', 'wrongcurrent', 'newpass123')
    ).rejects.toThrow('Current password is incorrect');
  });

  it('updates password and returns new tokens on success', async () => {
    const mockUser = buildMockUser();
    jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser as never);
    const saveSpy = jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as never);

    const result = await authService.updatePassword('user123', 'correctpass', 'newpass123');

    expect(result.accessToken).toBe('mock_access_token');
    expect(mockUser.password).toBe('newpass123');
    expect(saveSpy).toHaveBeenCalled();
  });
});
