import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
  updateStock,
} from '../controllers/producto.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', requireRole('SUPERADMIN', 'EMPLEADO'), createProduct);
router.patch('/:id/stock', requireRole('SUPERADMIN', 'EMPLEADO'), updateStock);
router.patch('/:id', requireRole('SUPERADMIN', 'EMPLEADO'), updateProduct);
router.delete('/:id', requireRole('SUPERADMIN', 'EMPLEADO'), deleteProduct);

export default router;
