import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/user.repository';
import { RegisterDto, LoginDto, TokenPair, JwtPayload, UserRole } from '../types';
import sendEmail from '../utils/sendEmail';

class AuthService {
  async register(data: RegisterDto): Promise<TokenPair> {
    const existing = await userRepository.findByUsername(data.username);
    if (existing) throw new Error('Username already taken');

    const emailTaken = await userRepository.findByEmail(data.email);
    if (emailTaken) throw new Error('Email already registered');

    // Public signup always creates a Coach — Athletes are created by coaches only
    const user = await userRepository.create({ ...data, role: UserRole.Coach });
    return this._buildTokenPair(user);
  }

  // One-time setup: creates the first admin account.
  // Blocked once any user exists in the database.
  async setupFirstAdmin(data: RegisterDto): Promise<TokenPair> {
    const allUsers = await userRepository.findAll();
    if (allUsers.length > 0) {
      throw new Error('Setup already complete. Use the Admin Panel to create new users.');
    }
    const user = await userRepository.create({ ...data, role: UserRole.Admin });
    return this._buildTokenPair(user);
  }

  // Returns true if no users exist yet (first-time setup needed)
  async isFirstTimeSetup(): Promise<boolean> {
    const users = await userRepository.findAll();
    return users.length === 0;
  }

  async login(data: LoginDto): Promise<TokenPair> {
    const user = await userRepository.findByUsername(data.username, true);

    if (!user) throw new Error('Invalid username or password');
    if (!user.isActive) throw new Error('Account has been deactivated');

    if (user.isLocked) {
      const remaining = Math.ceil(((user.lockUntil?.getTime() ?? 0) - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${remaining} minute(s)`);
    }

    const isMatch = await user.matchPassword(data.password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 5 * 60 * 1000);
        user.loginAttempts = 0;
      }
      await userRepository.save(user);
      throw new Error('Invalid username or password');
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    const tokens = this._buildTokenPair(user);
    user.refreshToken = tokens.refreshToken;
    await userRepository.save(user);

    return tokens;
  }

  async refreshTokens(token: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') throw new Error('Invalid token type');

    const user = await userRepository.findByRefreshToken(token);
    if (!user) throw new Error('Refresh token not recognised');

    const tokens = this._buildTokenPair(user);
    user.refreshToken = tokens.refreshToken;
    await userRepository.save(user);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await userRepository.update(userId, { $unset: { refreshToken: '' } });
  }

  async forgotPassword(email: string, clientUrl: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // Silent — don't reveal if email exists

    const resetToken = user.generatePasswordResetToken();
    await userRepository.save(user);

    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Athlete Tracker — Password Reset',
      html: `<p>Reset your password: <a href="${resetUrl}">Click here</a>. Expires in 10 minutes.</p>`,
    });
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<TokenPair> {
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await userRepository.findByResetToken(hashed);
    if (!user) throw new Error('Invalid or expired reset token');

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await userRepository.save(user);

    return this._buildTokenPair(user);
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<TokenPair> {
    const user = await userRepository.findById(userId, true);
    if (!user) throw new Error('User not found');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) throw new Error('Current password is incorrect');

    user.password = newPassword;
    await userRepository.save(user);

    return this._buildTokenPair(user);
  }

  private _buildTokenPair(user: Awaited<ReturnType<typeof userRepository.findById>> & object): TokenPair {
    // user is guaranteed non-null here
    const u = user as NonNullable<typeof user>;
    return {
      accessToken: u.generateAccessToken(),
      refreshToken: u.generateRefreshToken(),
      user: {
        id: u._id.toString(),
        name: u.name || u.username,
        username: u.username,
        email: u.email,
        role: u.role as UserRole,
      },
    };
  }
}

export default new AuthService();
