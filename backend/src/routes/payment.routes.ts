import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

router.use(protect);

router.get('/', authorize(UserRole.Admin, UserRole.Coach), paymentController.getPayments);
router.get('/summary', authorize(UserRole.Admin, UserRole.Coach), paymentController.getRevenueSummary);
router.get('/my', authorize(UserRole.Athlete), paymentController.getMyPayments);
router.get('/athlete/:athleteId', paymentController.getAthletePayments);
router.post('/', authorize(UserRole.Admin, UserRole.Coach), paymentController.createPayment);
router.put('/:id/pay', authorize(UserRole.Admin, UserRole.Coach), paymentController.markAsPaid);
router.put('/:id/self-pay', authorize(UserRole.Athlete), paymentController.selfPay);
router.put('/:id/reminder', authorize(UserRole.Admin, UserRole.Coach), paymentController.markReminderSent);

export default router;
