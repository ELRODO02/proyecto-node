import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';

const router = Router();

router.get('/', healthRoutes);

export default router;