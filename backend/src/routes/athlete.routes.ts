import { Router } from 'express';
import * as athleteController from '../controllers/athlete.controller';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { uploadPhoto } from '../middlewares/upload.middleware';
import { UserRole } from '../types';

const router = Router();

router.use(protect);

router.get('/stats/dashboard', getDashboardStats);
router.get('/search', athleteController.searchAthletes);

// IMPORTANT: /me must be registered BEFORE /:id to avoid Express treating "me" as an id param
router.get(
  '/me',
  authorize(UserRole.Athlete),
  athleteController.getMyAthleteProfile
);

router.get('/', athleteController.getAthletes);
router.get('/:id', athleteController.getAthlete);

router.post(
  '/',
  authorize(UserRole.Admin, UserRole.Coach),
  uploadPhoto,
  athleteController.createAthlete
);
router.put(
  '/:id',
  authorize(UserRole.Admin, UserRole.Coach),
  uploadPhoto,
  athleteController.updateAthlete
);
router.delete('/:id', authorize(UserRole.Admin), athleteController.deleteAthlete);

export default router;
