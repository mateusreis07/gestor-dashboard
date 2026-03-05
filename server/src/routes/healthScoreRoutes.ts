import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getOrCreateConfig, saveConfig, getHealthScoreHistory, calculateAndSaveHealthScore, getHealthScoreDetails } from '../services/healthScoreService';
import { prisma } from '../prisma';

const router = Router();

// Get the Health Score for a specific month
router.get('/:teamId/health-score', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const month = req.query.month ? String(req.query.month) : undefined;

    if (!month) {
      return res.status(400).json({ error: 'Parâmetro month (YYYY-MM) é obrigatório.' });
    }

    const team = await prisma.user.findUnique({
      where: { id: teamId, role: 'TEAM' },
    });

    if (!team) {
      return res.status(404).json({ error: 'Time não encontrado' });
    }

    const result = await getHealthScoreHistory(teamId, month);

    if (!result) {
      return res.status(200).json({
        status: 'empty',
        message: `Nenhum ticket ou chamado encontrado para o mês ${month}. O Health Score não pôde ser calculado.`
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching health score:', error);
    return res.status(500).json({ error: 'Erro ao processar Health Score' });
  }
});

// Get the detailed Drill-Down for Health Score
router.get('/:teamId/health-score/details', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const month = req.query.month ? String(req.query.month) : undefined;

    if (!month) {
      return res.status(400).json({ error: 'Parâmetro month (YYYY-MM) é obrigatório.' });
    }

    const team = await prisma.user.findUnique({
      where: { id: teamId, role: 'TEAM' },
    });

    if (!team) {
      return res.status(404).json({ error: 'Time não encontrado' });
    }

    const result = await getHealthScoreDetails(teamId, month);

    if (!result) {
      return res.status(200).json({
        status: 'empty',
        message: `Nenhum dado encontrado para o mês ${month}.`
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching health score details:', error);
    return res.status(500).json({ error: 'Erro ao processar Health Score Details' });
  }
});

// Calculate or Recalculate Forcefully
router.post('/:teamId/health-score/recalculate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ error: 'Parâmetro month (YYYY-MM) é obrigatório.' });
    }

    const history = await calculateAndSaveHealthScore(teamId, month);
    return res.status(200).json({ success: true, history });

  } catch (error: any) {
    console.error('Error recalculating health score:', error);
    return res.status(500).json({ error: error.message || 'Erro ao recalcular' });
  }
});

// Get Configuration
router.get('/:teamId/health-score/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const config = await getOrCreateConfig(teamId);
    return res.status(200).json(config);
  } catch (error) {
    console.error('Error fetching health score config:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Update Configuration
router.put('/:teamId/health-score/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const configData = req.body;

    const newConfig = await saveConfig(teamId, configData);

    return res.status(200).json({ success: true, config: newConfig });
  } catch (error) {
    console.error('Error updating health score config:', error);
    return res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

export default router;
