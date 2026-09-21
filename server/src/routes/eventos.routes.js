import { Router } from 'express';
import { subscribeStock } from '../controllers/eventos.controller.js';

const router = Router();

router.get('/stock', subscribeStock);

export default router;
