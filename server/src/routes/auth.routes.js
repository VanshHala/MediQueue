import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  registerSchema,
  loginSchema,
  profileUpdateSchema
} from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public auth endpoints
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

// Protected user endpoints
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, validateBody(profileUpdateSchema), updateProfile);

export default router;
