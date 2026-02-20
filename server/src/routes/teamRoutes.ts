import express from 'express';
import { getTeamDashboard, saveManualStats, uploadData, resetTeamData } from '../controllers/teamController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware); // All team routes are protected

// Dashboard Data
router.get('/:teamId/dashboard', getTeamDashboard);

// Update Manual Stats
router.post('/:teamId/manual-stats', saveManualStats);

// Upload Data (Tickets/Chamados)
router.post('/:teamId/upload', uploadData);

// Reset Data
router.delete('/:teamId/data', resetTeamData);

export default router;
