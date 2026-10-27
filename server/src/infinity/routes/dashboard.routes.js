import { Router } from 'express';
import { getGymDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', getGymDashboard);

export default router;
