import { Router } from 'express';
import {
  cerrarSucursal,
  createSucursal,
  getSucursales,
  reabrirSucursal,
  updateSucursal,
} from '../controllers/sucursal.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getSucursales);
router.post('/', requireRole('SUPERADMIN'), createSucursal);
router.post('/:id/cerrar', requireRole('SUPERADMIN'), cerrarSucursal);
router.post('/:id/reabrir', requireRole('SUPERADMIN'), reabrirSucursal);
router.patch('/:id', requireRole('SUPERADMIN'), updateSucursal);

export default router;
