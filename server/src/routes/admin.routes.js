import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import {
  getAnalytics,
  getUsers,
  updateUserRole,
  deleteUser,
  getDepartments,
  createDepartment,
  getDailyReport
} from '../controllers/admin.controller.js';

const router = Router();

// Restrict all routes below to authenticated Admins only
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/analytics', getAnalytics);
router.get('/report', getDailyReport);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);

export default router;
