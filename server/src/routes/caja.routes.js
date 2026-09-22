import { Router } from 'express';
import {
  abrirCaja,
  cerrarCaja,
  crearMovimientoCaja,
  getCajaAbierta,
  getCajas,
} from '../controllers/caja.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
const staff = requireRole('SUPERADMIN', 'EMPLEADO');

router.get('/', getCajas);
router.get('/abierta', getCajaAbierta);
router.post('/abrir', staff, abrirCaja);
router.post('/:id/movimientos', staff, crearMovimientoCaja);
router.post('/:id/cerrar', staff, cerrarCaja);

export default router;
