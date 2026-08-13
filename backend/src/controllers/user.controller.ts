import { Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { AuthRequest } from '../types';

export const getAllUsers = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await userService.getAll();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const toggleUserActive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.toggleActive(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
