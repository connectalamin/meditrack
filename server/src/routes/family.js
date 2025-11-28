import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { familyMemberSchema, updateFamilyMemberSchema } from '../utils/validation.js';
import * as familyController from '../controllers/familyController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', familyController.getFamilyMembers);
router.post('/', validate(familyMemberSchema), familyController.createFamilyMember);
router.put('/:id', validate(updateFamilyMemberSchema), familyController.updateFamilyMember);
router.delete('/:id', familyController.deleteFamilyMember);

export default router;

