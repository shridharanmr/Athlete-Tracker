import { Router } from 'express';
import * as eventController from '../controllers/event.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();
router.use(protect);

router.get('/',      authorize(UserRole.Admin, UserRole.Coach), eventController.getEvents);
router.get('/:id',   authorize(UserRole.Admin, UserRole.Coach), eventController.getEvent);
router.post('/',     authorize(UserRole.Admin, UserRole.Coach), eventController.createEvent);
router.put('/:id',   authorize(UserRole.Admin, UserRole.Coach), eventController.updateEvent);
router.delete('/:id',authorize(UserRole.Admin, UserRole.Coach), eventController.deleteEvent);
router.post('/:id/participants',         authorize(UserRole.Admin, UserRole.Coach), eventController.addParticipant);
router.delete('/:id/participants/:athleteId', authorize(UserRole.Admin, UserRole.Coach), eventController.removeParticipant);

export default router;
