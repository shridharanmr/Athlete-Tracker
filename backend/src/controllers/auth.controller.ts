import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { AuthRequest, RegisterDto, LoginDto } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokens = await authService.register(req.body as RegisterDto);
    res.status(201).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/setup — public, only works when zero users exist
export const setupFirstAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokens = await authService.setupFirstAdmin(req.body as RegisterDto);
    res.status(201).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/setup-status — public, tells frontend if first-time setup is needed
export const getSetupStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isFirstTime = await authService.isFirstTimeSetup();
    res.status(200).json({ success: true, data: { isFirstTimeSetup: isFirstTime } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokens = await authService.login(req.body as LoginDto);
    res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }
    const tokens = await authService.refreshTokens(token);
    res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logout(req.user!._id.toString());
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = (req: AuthRequest, res: Response): void => {
  res.status(200).json({ success: true, data: req.user });
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email, process.env.CLIENT_URL || 'http://localhost:3000');
    res.status(200).json({ success: true, message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokens = await authService.resetPassword(req.params.resetToken, req.body.password);
    res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokens = await authService.updatePassword(
      req.user!._id.toString(),
      req.body.currentPassword,
      req.body.newPassword
    );
    res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};
