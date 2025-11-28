import express from 'express';
import { authenticate } from '../middleware/auth.js';
import uploadMemory from '../middleware/uploadMemory.js';
import * as ocrController from '../controllers/ocrController.js';

const router = express.Router();

router.use(authenticate);

router.post('/process', uploadMemory.single('image'), ocrController.processOCR);

export default router;

