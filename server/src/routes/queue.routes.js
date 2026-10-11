import { Router } from 'express';
import {
  getDoctorQueue,
  callNextPatient,
  completeConsultation,
  markNoShow,
  skipPatient,
  registerWalkin,
  registerEmergency,
  getTodayQueue,
  getDisplayQueue
} from '../controllers/queue.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// Public Live TV display (no authentication required)
router.get('/display', getDisplayQueue);

// Doctor queue actions
router.get('/doctor', authenticateToken, requireRole('doctor'), getDoctorQueue);
router.post('/call-next', authenticateToken, requireRole('doctor'), callNextPatient);
router.put('/:id/complete', authenticateToken, requireRole('doctor'), completeConsultation);
router.put('/:id/noshow', authenticateToken, requireRole('doctor'), markNoShow);
router.put('/:id/skip', authenticateToken, requireRole('doctor'), skipPatient);

// Receptionist & Admin triage queue actions
router.get('/today', authenticateToken, requireRole('receptionist', 'admin'), getTodayQueue);

export default router;
