import { Router } from 'express';
import { getSucursales } from '../controllers/sucursal.controller.js';

const router = Router();

router.get('/', getSucursales);

export default router;
