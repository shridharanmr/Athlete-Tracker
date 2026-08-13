import { Router } from 'express';
import * as performanceController from '../controllers/performance.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

router.use(protect);

router.post('/', authorize(UserRole.Admin, UserRole.Coach), performanceController.addRecord);
router.get('/my/weekly', authorize(UserRole.Athlete), performanceController.getMyWeeklyPerformance);
router.get('/athlete/:athleteId', performanceController.getAthleteRecords);
router.get('/athlete/:athleteId/events', performanceController.getDistinctEvents);
router.get('/athlete/:athleteId/analyse/:eventName', performanceController.analysePerformance);
router.get('/athlete/:athleteId/trend/:eventName', performanceController.getMonthlyTrend);
router.delete('/:id', authorize(UserRole.Admin, UserRole.Coach), performanceController.deleteRecord);

export default router;
