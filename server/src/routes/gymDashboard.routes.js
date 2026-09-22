import { Router } from 'express';
import { getGymDashboard } from '../controllers/gymDashboard.controller.js';

const router = Router();

router.get('/', getGymDashboard);

export default router;
