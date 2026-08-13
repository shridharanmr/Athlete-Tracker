import { Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';
import paymentRepository from '../repositories/payment.repository';
import { AuthRequest, PaymentStatus } from '../types';

export const getPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as PaymentStatus | undefined;
    const { payments, total } = await paymentService.getAll(req.user!, page, limit, status);
    res.status(200).json({ success: true, data: payments, total, page, limit });
  } catch (err) {
    next(err);
  }
};

export const getAthletePayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payments = await paymentService.getByAthlete(req.params.athleteId, req.user!);
    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

export const createPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payment = await paymentService.create(req.body, req.user!);
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

export const markAsPaid = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payment = await paymentService.markAsPaid(req.params.id, req.body.transactionId);
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

export const getMyPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const athlete = await (await import('../repositories/athlete.repository')).default.findByUserId(req.user!.id);
    if (!athlete) { res.status(404).json({ success: false, message: 'Athlete profile not found' }); return; }
    const payments = await paymentService.getByAthlete(athlete._id.toString(), req.user!);
    res.status(200).json({ success: true, data: payments });
  } catch (err) { next(err); }
};

export const selfPay = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const athleteRepo = (await import('../repositories/athlete.repository')).default;
    const athlete = await athleteRepo.findByUserId(req.user!.id);
    if (!athlete) { res.status(404).json({ success: false, message: 'Athlete profile not found' }); return; }
    const payment = await paymentRepository.findById(req.params.id);
    if (!payment) { res.status(404).json({ success: false, message: 'Payment not found' }); return; }
    if (payment.athlete.toString() !== athlete._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorised to pay this record' }); return;
    }
    const updated = await paymentRepository.update(req.params.id, {
      status: PaymentStatus.Paid,
      paidDate: new Date(),
      paidAt: new Date(),
    });
    res.status(200).json({ success: true, data: updated });
  } catch (err) { next(err); }
};

export const markReminderSent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await paymentRepository.update(req.params.id, { reminderSentAt: new Date() });
    if (!updated) { res.status(404).json({ success: false, message: 'Payment not found' }); return; }
    res.status(200).json({ success: true, data: updated });
  } catch (err) { next(err); }
};

export const getRevenueSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await paymentService.getRevenueSummary(req.user!);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};
