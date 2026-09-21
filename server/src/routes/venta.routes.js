import { Router } from 'express';
import {
  createVenta,
  getVenta,
  getVentas,
  updateEstadoVenta,
} from '../controllers/venta.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getVentas);
router.get('/:id', getVenta);
router.post('/', requireRole('SUPERADMIN', 'EMPLEADO'), createVenta);
router.patch('/:id/estado', requireRole('SUPERADMIN', 'EMPLEADO'), updateEstadoVenta);

export default router;
