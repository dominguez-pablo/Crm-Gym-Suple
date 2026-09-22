import { Router } from 'express';
import { createPlan, getPlanes, updatePlan } from '../controllers/plan.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getPlanes);
router.post('/', requireRole('SUPERADMIN'), createPlan);
router.patch('/:id', requireRole('SUPERADMIN'), updatePlan);

export default router;
