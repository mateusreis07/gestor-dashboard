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

    const forceRefresh = req.query.force === 'true';

    // Obter data atual para o limite diário
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyUsage = await prisma.aiUsage.findUnique({ where: { date: todayStr } });
    const callsToday = dailyUsage ? dailyUsage.count : 0;

    // Verify if there's already generated insights for this month
    let monthlyData = await prisma.monthlyData.findUnique({
      where: {
        userId_month: {
          userId: teamId,
          month: String(month)
        }
      }
    });

    if (monthlyData && monthlyData.aiInsights && !forceRefresh) {
      const stored = monthlyData.aiInsights as any;
      // Handle legacy cache logic where stored is an array [Insight]
      if (Array.isArray(stored)) {
        return res.status(200).json({
          insights: stored,
          modeloUsado: 'gemini-legacy-cache',
          cotaDiaria: '15 análises/dia',
          usoHoje: callsToday
        });
      }
      return res.status(200).json({ ...stored, usoHoje: callsToday });
    }

    if (!forceRefresh) {
      // Se o usuário apenas abriu o modal (sem forçar) e não tem insights na DB, não gasta cota da IA, retorna vazio.
      return res.status(200).json({ insights: [] });
    }

    // Gerar novos insights
    const aiResult = await generateInsights(team.name || team.email, month, tickets, chamados);

    // Incrementar o uso e pegar o novo valor
    const updatedUsage = await prisma.aiUsage.upsert({
      where: { date: todayStr },
      update: { count: { increment: 1 } },
      create: { date: todayStr, count: 1 }
    });

    const finalResult = { ...aiResult, usoHoje: updatedUsage.count };

    // Save/Update generated insights inside MonthlyData
    monthlyData = await prisma.monthlyData.upsert({
      where: {
        userId_month: {
          userId: teamId,
          month: String(month)
        }
      },
      update: {
        aiInsights: aiResult as any
      },
      create: {
        userId: teamId,
        month: String(month),
        aiInsights: finalResult as any
      }
    });

    res.json(finalResult);
  } catch (error: any) {
    console.error('Erro na rota de Insights:', error);
    res.status(500).json({ error: 'Erro ao gerar insights.', details: error.message });
  }
});

export default router;
