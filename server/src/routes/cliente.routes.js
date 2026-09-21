import { Router } from 'express';
import {
  createCliente,
  getCliente,
  getClientes,
  updateCliente,
} from '../controllers/cliente.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getClientes);
router.get('/:id', getCliente);
router.post('/', requireRole('SUPERADMIN', 'EMPLEADO'), createCliente);
router.patch('/:id', requireRole('SUPERADMIN', 'EMPLEADO'), updateCliente);

export default router;
