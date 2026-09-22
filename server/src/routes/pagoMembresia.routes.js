import { Router } from 'express';
import { createPago, getPagos } from '../controllers/pagoMembresia.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getPagos);
router.post('/', requireRole('SUPERADMIN', 'EMPLEADO'), createPago);

export default router;
