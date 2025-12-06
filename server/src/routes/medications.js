import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { medicationSchema, updateMedicationSchema } from '../utils/validation.js';
import * as medicationController from '../controllers/medicationController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', medicationController.getMedications);
router.post('/', validate(medicationSchema), medicationController.createMedication);
router.post('/load', medicationController.loadMedicines);
router.put('/:id', validate(updateMedicationSchema), medicationController.updateMedication);
router.delete('/:id', medicationController.deleteMedication);

export default router;

