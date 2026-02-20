import express from 'express';
import { listTeams, createTeam, updateTeam, deleteTeam } from '../controllers/teamsController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/', listTeams);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

export default router;
