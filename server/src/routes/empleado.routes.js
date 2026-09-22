import { Router } from 'express';
import {
  createEmpleado,
  getEmpleados,
  updateEmpleado,
} from '../controllers/empleado.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireRole('SUPERADMIN'), getEmpleados);
router.post('/', requireRole('SUPERADMIN'), createEmpleado);
router.patch('/:id', requireRole('SUPERADMIN'), updateEmpleado);

export default router;
