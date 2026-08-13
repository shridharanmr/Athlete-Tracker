import { Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service';
import { AuthRequest, UserRole } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await dashboardService.getStats(
      req.user!._id.toString(),
      req.user!.role as UserRole
    );
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
