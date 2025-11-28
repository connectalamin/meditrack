import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { purchaseListItemSchema, updatePurchaseListItemSchema } from '../utils/validation.js';
import * as purchaseListController from '../controllers/purchaseListController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', purchaseListController.getPurchaseListItems);
router.post('/', validate(purchaseListItemSchema), purchaseListController.createPurchaseListItem);
router.put('/:id', validate(updatePurchaseListItemSchema), purchaseListController.updatePurchaseListItem);
router.delete('/:id', purchaseListController.deletePurchaseListItem);

export default router;

