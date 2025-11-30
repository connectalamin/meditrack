import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reportSchema, updateReportSchema } from '../utils/validation.js';
import upload, { optimizeUploadedFile } from '../middleware/upload.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', reportController.getReports);
router.post('/', upload.single('file'), optimizeUploadedFile, validate(reportSchema), reportController.createReport);
router.put('/:id', upload.single('file'), optimizeUploadedFile, validate(updateReportSchema), reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

export default router;

