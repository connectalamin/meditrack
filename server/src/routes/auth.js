import express from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', authController.googleLogin);
router.get('/me', authenticate, authController.getMe);
router.get('/devices', authenticate, authController.getDevices);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/join-family', authenticate, authController.joinFamily);
router.get('/linked-accounts', authenticate, authController.getLinkedAccounts);
router.post('/remove-linked-account', authenticate, authController.removeLinkedAccount);
router.delete('/data', authenticate, authController.clearUserData);

export default router;

