import { Router } from 'express';
import {
  bookAppointment,
  getMyAppointments,
  getAppointmentEta,
  checkinAppointment,
  cancelAppointment,
  bookAppointmentSchema
} from '../controllers/appointments.controller.js';
import {
  registerWalkin,
  registerEmergency
} from '../controllers/queue.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// Patient online booking
router.post('/', authenticateToken, validateBody(bookAppointmentSchema), bookAppointment);
router.get('/mine', authenticateToken, getMyAppointments);
router.get('/:id/eta', getAppointmentEta);
router.put('/:id/checkin', authenticateToken, checkinAppointment);
router.put('/:id/cancel', authenticateToken, cancelAppointment);

// Receptionist & Admin walkin / emergency endpoints
router.post('/walkin', authenticateToken, requireRole('receptionist', 'admin'), registerWalkin);
router.post('/emergency', authenticateToken, requireRole('receptionist', 'admin'), registerEmergency);

export default router;
