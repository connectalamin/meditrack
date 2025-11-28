import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { healthDataSchema, updateHealthDataSchema } from '../utils/validation.js';
import * as healthDataController from '../controllers/healthDataController.js';

const router = express.Router();

router.use(authenticate);

router.get('/:familyMemberId', healthDataController.getHealthData);
router.post('/:familyMemberId', validate(healthDataSchema), healthDataController.createHealthData);
router.put('/:familyMemberId/:id', validate(updateHealthDataSchema), healthDataController.updateHealthData);
router.delete('/:familyMemberId/:id', healthDataController.deleteHealthData);

export default router;

