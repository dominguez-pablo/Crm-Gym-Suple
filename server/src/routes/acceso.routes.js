import { Router } from 'express';
import { createAcceso, getAccesos } from '../controllers/acceso.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAccesos);
router.post('/', requireRole('SUPERADMIN', 'EMPLEADO'), createAcceso);

export default router;
