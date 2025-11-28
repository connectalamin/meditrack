import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { planSchema, updatePlanSchema } from '../utils/validation.js';
import * as planController from '../controllers/planController.js';

const router = express.Router();

router.use(authenticate);

router.get('/:familyMemberId', planController.getPlans);
router.post('/:familyMemberId', validate(planSchema), planController.createPlan);
router.put('/:familyMemberId/:id', validate(updatePlanSchema), planController.updatePlan);
router.delete('/:familyMemberId/:id', planController.deletePlan);

export default router;

