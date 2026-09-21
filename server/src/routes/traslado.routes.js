import { Router } from 'express';
import { createTraslado, getTraslados } from '../controllers/traslado.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getTraslados);
router.post('/', requireRole('SUPERADMIN', 'EMPLEADO'), createTraslado);

export default router;
