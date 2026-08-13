import { Response, NextFunction } from 'express';
import athleteService from '../services/athlete.service';
import athleteRepository from '../repositories/athlete.repository';
import { AuthRequest, UserRole } from '../types';

export const getAthletes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      search:        req.query.search as string | undefined,
      gender:        req.query.gender as string | undefined,
      paymentStatus: req.query.paymentStatus as string | undefined,
    };
    const { athletes, total } = await athleteService.getAll(req.user!, page, limit, filters);
    res.status(200).json({
      success: true,
      data: athletes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

export const getAthlete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const athlete = await athleteService.getById(req.params.id, req.user!);
    res.status(200).json({ success: true, data: athlete });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /athletes/me
 * Returns the athlete profile linked to the currently logged-in Athlete user.
 * Only accessible by users with role = athlete.
 */
export const getMyAthleteProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Find the Athlete doc whose userId matches the logged-in user
    const athlete = await athleteRepository.findByUserId(userId);

    if (!athlete) {
      res.status(404).json({ success: false, message: 'Athlete profile not found for this user' });
      return;
    }

    res.status(200).json({ success: true, data: athlete });
  } catch (err) {
    next(err);
  }
};

export const createAthlete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profilePhoto = req.file ? req.file.filename : undefined;
    const body = { ...req.body };
    if (typeof body.events === 'string') {
      try { body.events = JSON.parse(body.events); } catch { body.events = []; }
    }
    if (typeof body.kitSizes === 'string') {
      try { body.kitSizes = JSON.parse(body.kitSizes); } catch { body.kitSizes = {}; }
    }
    if (profilePhoto) body.profilePhoto = profilePhoto;
    const { athlete, credentials } = await athleteService.create(body, req.user!);
    res.status(201).json({ success: true, data: athlete, credentials });
  } catch (err) {
    next(err);
  }
};

export const updateAthlete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profilePhoto = req.file ? req.file.filename : undefined;
    const body = { ...req.body };
    if (typeof body.events === 'string') {
      try { body.events = JSON.parse(body.events); } catch { body.events = []; }
    }
    if (typeof body.kitSizes === 'string') {
      try { body.kitSizes = JSON.parse(body.kitSizes); } catch { body.kitSizes = {}; }
    }
    if (profilePhoto) body.profilePhoto = profilePhoto;
    const athlete = await athleteService.update(req.params.id, body, req.user!);
    res.status(200).json({ success: true, data: athlete });
  } catch (err) {
    next(err);
  }
};

export const deleteAthlete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await athleteService.delete(req.params.id, req.user!);
    res.status(200).json({ success: true, message: 'Athlete deleted' });
  } catch (err) {
    next(err);
  }
};

export const searchAthletes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({ success: false, message: 'Search query required' });
      return;
    }
    const athletes = await athleteService.search(q, req.user!);
    res.status(200).json({ success: true, data: athletes });
  } catch (err) {
    next(err);
  }
};
