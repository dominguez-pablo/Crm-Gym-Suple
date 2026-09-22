import { Router } from 'express';
import {
  createSocio,
  getSocio,
  getSocios,
  updateSocio,
} from '../controllers/socio.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getSocios);
router.get('/:id', getSocio);
router.post('/', requireRole('SUPERADMIN', 'EMPLEADO'), createSocio);
router.patch('/:id', requireRole('SUPERADMIN', 'EMPLEADO'), updateSocio);

export default router;
