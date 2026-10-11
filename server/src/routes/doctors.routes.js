import { Router } from 'express';
import {
  getDoctors,
  getDoctorSlots,
  createDoctor,
  updateDoctor,
  updateDoctorMyStatus,
  doctorCreateSchema,
  doctorUpdateSchema,
  doctorStatusSchema
} from '../controllers/doctors.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// Public / Patient endpoints
router.get('/', getDoctors);
router.get('/:id/slots', getDoctorSlots);

// Doctor self-status update
router.put('/me/status', authenticateToken, requireRole('doctor'), validateBody(doctorStatusSchema), updateDoctorMyStatus);

// Admin doctor management
router.post('/', authenticateToken, requireRole('admin'), validateBody(doctorCreateSchema), createDoctor);
router.put('/:id', authenticateToken, requireRole('admin'), validateBody(doctorUpdateSchema), updateDoctor);

export default router;
