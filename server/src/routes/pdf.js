import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as pdfController from '../controllers/pdfController.js';

const router = express.Router();

router.use(authenticate);

// Generate PDF for individual metric
router.get('/health-data/:familyMemberId/metric/:type', pdfController.generateMetricPDF);

// Generate PDF for all vitals
router.get('/health-data/:familyMemberId/all', pdfController.generateAllVitalsPDF);

export default router;

