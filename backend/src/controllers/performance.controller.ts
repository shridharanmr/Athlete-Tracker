import { Response, NextFunction } from 'express';
import performanceService from '../services/performance.service';
import performanceRepository from '../repositories/performance.repository';
import { broadcastPerformanceUpdate } from '../sockets/socket.handler';
import { AuthRequest, UserRole } from '../types';

export const getMyWeeklyPerformance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const athleteRepo = (await import('../repositories/athlete.repository')).default;
    const athlete = await athleteRepo.findByUserId(req.user!.id);
    if (!athlete) { res.status(404).json({ success: false, message: 'Athlete profile not found' }); return; }
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const records = await performanceRepository.findByAthleteAndDateRange(athlete._id.toString(), weekAgo, new Date());
    res.status(200).json({ success: true, data: records });
  } catch (err) { next(err); }
};

export const addRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await performanceService.addRecord(req.body, req.user!);
    // Broadcast real-time update to all coaches
    broadcastPerformanceUpdate({
      athleteName: (record.athlete as { name?: string })?.name ?? 'Athlete',
      eventName: record.eventName,
      result: record.result,
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

export const getAthleteRecords = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await performanceService.getAthleteRecords(req.params.athleteId, req.user!);
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

export const analysePerformance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { athleteId, eventName } = req.params;
    const analysis = await performanceService.analysePerformance(athleteId, decodeURIComponent(eventName));
    res.status(200).json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyTrend = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { athleteId, eventName } = req.params;
    const trend = await performanceService.getMonthlyTrend(athleteId, decodeURIComponent(eventName));
    res.status(200).json({ success: true, data: trend });
  } catch (err) {
    next(err);
  }
};

export const getDistinctEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const events = await performanceService.getDistinctEvents(req.params.athleteId);
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await performanceRepository.findById(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }
    // Coaches can only delete their own records
    if (req.user!.role === UserRole.Coach && record.coach.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorised' });
      return;
    }
    await performanceRepository.deleteById(req.params.id);
    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (err) {
    next(err);
  }
};
