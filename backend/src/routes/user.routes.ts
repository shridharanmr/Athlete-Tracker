import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

router.use(protect, authorize(UserRole.Admin));

router.get('/', userController.getAllUsers);
router.patch('/:id/toggle-active', userController.toggleUserActive);

export default router;
