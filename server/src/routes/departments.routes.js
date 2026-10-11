import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  departmentSchema
} from '../controllers/departments.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.get('/', getDepartments);
router.post('/', authenticateToken, requireRole('admin'), validateBody(departmentSchema), createDepartment);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteDepartment);

export default router;
