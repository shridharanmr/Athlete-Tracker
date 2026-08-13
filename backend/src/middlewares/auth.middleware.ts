import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, UserRole } from '../types';
import userRepository from '../repositories/user.repository';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    if (decoded.type !== 'access') {
      res.status(401).json({ success: false, message: 'Invalid token type' });
      return;
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or deactivated' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not authorised for this route`,
      });
      return;
    }
    next();
  };
};
