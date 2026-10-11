import { Router } from 'express';
import {
  getDonorProfile,
  updateDonorProfile,
  createBloodRequest,
  getBloodRequests,
  getBloodRequestById,
  getNearbyDonorsForRequest,
  getAllDonors,
  respondToBloodRequest,
  fulfillBloodRequest,
} from '../controllers/blood.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/donors', getAllDonors);
router.get('/requests', getBloodRequests);
router.get('/requests/:id', getBloodRequestById);
router.get('/requests/:id/donors', getNearbyDonorsForRequest);

// Authenticated routes
router.get('/donor-profile', authenticateToken, getDonorProfile);
router.put('/donor-profile', authenticateToken, updateDonorProfile);
router.post('/requests', authenticateToken, createBloodRequest);
router.post('/requests/:id/respond', authenticateToken, respondToBloodRequest);
router.put('/requests/:id/fulfill', authenticateToken, fulfillBloodRequest);

export default router;
