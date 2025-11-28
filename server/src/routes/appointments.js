import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { appointmentSchema, updateAppointmentSchema } from '../utils/validation.js';
import * as appointmentController from '../controllers/appointmentController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', appointmentController.getAppointments);
router.post('/', validate(appointmentSchema), appointmentController.createAppointment);
router.put('/:id', validate(updateAppointmentSchema), appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

export default router;

