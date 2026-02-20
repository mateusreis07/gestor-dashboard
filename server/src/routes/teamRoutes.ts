import express from 'express';
import { getTeamDashboard, saveManualStats, uploadData, resetTeamData, getYearlyIndicators, saveYearlyIndicators } from '../controllers/teamController';
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

// Yearly Indicators
router.get('/:teamId/yearly-indicators', getYearlyIndicators);
router.post('/:teamId/yearly-indicators', saveYearlyIndicators);

export default router;
