import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

router.use(authenticate);

router.get('/ai', analyticsController.getAIAnalytics);

export default router;

