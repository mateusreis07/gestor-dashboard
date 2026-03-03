import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../prisma';
import { generateInsights } from '../services/aiService';

const router = Router();

router.get('/:teamId/insights', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const month = req.query.month ? String(req.query.month) : undefined;

    if (!month) {
      return res.status(400).json({ error: 'Parâmetro month (YYYY-MM) é obrigatório.' });
    }

    const team = await prisma.user.findUnique({
      where: { id: teamId, role: 'TEAM' },
      select: { id: true, name: true, email: true }
    });
    if (!team) {
      return res.status(404).json({ error: 'Time não encontrado' });
    }

    const dateFilter = { startsWith: String(month) };

    const tickets = await prisma.ticket.findMany({
      where: { userId: teamId, dataAbertura: dateFilter },
      take: 2000
    });

    const chamados = await prisma.chamado.findMany({
      where: { userId: teamId, criado: dateFilter },
      take: 2000
    });

    if (tickets.length === 0 && chamados.length === 0) {
      return res.status(200).json({
        insights: [{
          tipo: 'neutro',
          titulo: 'Sem Dados no Período',
          descricao: `Nenhum dado encontrado para ${month}. Importe arquivos GLPI/JIRA deste mês para gerar insights.`,
          metricaDeApoio: '0 registros'
        }]
      });
    }

    const insights = await generateInsights(team.name || team.email, month, tickets, chamados);
    res.json({ insights });
  } catch (error: any) {
    console.error('Erro na rota de Insights:', error);
    res.status(500).json({ error: 'Erro ao gerar insights.', details: error.message });
  }
});

export default router;
