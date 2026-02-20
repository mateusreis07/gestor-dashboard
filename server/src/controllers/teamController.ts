import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getTeamDashboard = async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const month = req.query.month ? String(req.query.month) : undefined;

    const team = await prisma.user.findUnique({
      where: { id: teamId, role: 'TEAM' },
      select: { id: true, name: true, email: true }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Filtro de data (mês) se fornecido
    const dateFilter = month ? { startsWith: String(month) } : undefined;

    const tickets = await prisma.ticket.findMany({
      where: {
        userId: teamId,
        ...(dateFilter ? { dataAbertura: dateFilter } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 2000
    });

    const chamados = await prisma.chamado.findMany({
      where: {
        userId: teamId,
        ...(dateFilter ? { criado: dateFilter } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 2000
    });

    let manualStats = null;
    if (month) {
      manualStats = await prisma.monthlyData.findFirst({
        where: { userId: teamId, month: String(month) }
      });
    }

    // Busca meses disponíveis (agrupando datas de tickets e chamados)
    // Como Prisma não tem distinct on substring SQL nativo fácil aqui,
    // buscamos apenas as datas para processar em memória (leve para <10k registros)
    const ticketDates = await prisma.ticket.findMany({
      where: { userId: teamId },
      select: { dataAbertura: true }
    });

    const chamadoDates = await prisma.chamado.findMany({
      where: { userId: teamId },
      select: { criado: true }
    });

    const monthsSet = new Set<string>();
    ticketDates.forEach(t => {
      if (t.dataAbertura && t.dataAbertura.length >= 7 && !t.dataAbertura.includes('NaN')) {
        monthsSet.add(t.dataAbertura.substring(0, 7));
      }
    });
    chamadoDates.forEach(c => {
      if (c.criado && c.criado.length >= 7 && !c.criado.includes('NaN')) {
        monthsSet.add(c.criado.substring(0, 7));
      }
    });

    // Calcular histórico anual (independente do filtro de mês da query principal)
    // Precisamos buscar TODAS as datas de tickets do time para montar o gráfico de evolução
    const allTicketDates = await prisma.ticket.findMany({
      where: { userId: teamId },
      select: { dataAbertura: true }
    });

    const yearlyHistory = new Array(12).fill(0);
    allTicketDates.forEach(t => {
      if (t.dataAbertura && t.dataAbertura.length >= 7) {
        // Extrai mês com segurança de fuso (pega da string)
        const parts = t.dataAbertura.includes('T')
          ? t.dataAbertura.split('T')[0].split(/[-/]/)
          : t.dataAbertura.split(/[-/]/);

        // Formato esperado: YYYY-MM-DD ou DD/MM/YYYY.
        // Se for ISO (YYYY-MM-DD), mês é parts[1].
        // Se for BR (DD/MM/YYYY), mês é parts[1].
        // Em ambos os casos, o mês está no índice 1 se tiver separadores corretos.
        if (parts.length >= 2) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11) {
            yearlyHistory[monthIndex]++;
          }
        }
      }
    });

    // Ordena decrescente (mais recente primeiro)
    const availableMonths = Array.from(monthsSet).sort().reverse();
    console.log('Available months for team', teamId, ':', availableMonths);

    res.json({
      team,
      tickets,
      chamados,
      manualStats: manualStats ? { satisfaction: manualStats.satisfaction, manuals: manualStats.manuals } : null,
      availableMonths,
      history: yearlyHistory // Retorna o histórico calculado
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveManualStats = async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const { month, satisfaction, manuals } = req.body;

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    // Use upsert to create or update
    // Note: The unique constraint is on [userId, month]
    // But Prisma upsert needs a unique 'where' clause.
    // We will need to check if we can rely on the @@unique or if we should use findFirst

    // Since we have @@unique([userId, month]), we will need to create a composite key usage or workaround.
    // Actually, prisma allows findUnique/upsert on @@unique if fields are scalar.

    // However, Prisma generates a compound unique input type. Let's see.
    // Assuming schema.prisma has @@unique([userId, month])

    // Wait, Prisma upsert require a unique identifier.
    // Let's use findFirst then update/create manually for simplicity if keys are tricky,
    // or ensure schema supports it.

    const existing = await prisma.monthlyData.findFirst({
      where: { userId: teamId, month }
    });

    if (existing) {
      const updated = await prisma.monthlyData.update({
        where: { id: existing.id },
        data: { satisfaction, manuals }
      });
      return res.json(updated);
    } else {
      const created = await prisma.monthlyData.create({
        data: { userId: teamId, month, satisfaction, manuals }
      });
      return res.json(created);
    }

  } catch (error) {
    console.error('Save stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper para converter data DD/MM/YYYY HH:mm ou DD/MM/YYYY para ISO
const formatDateToISO = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString();

  // Se já for ISO (contém - e parece ano no começo), retorna
  if (dateStr.includes('-') && (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr))) return dateStr;

  try {
    // Tenta formato BR: dd/mm/yyyy ou dd-mm-yyyy
    // Primeiro remove a hora se houver
    const datePart = dateStr.split(' ')[0];
    const parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');

    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);

      // Valida se a data é válida
      if (isNaN(d.getTime())) {
        console.warn('Data inválida gerada:', dateStr);
        return new Date().toISOString();
      }

      // Ajusta para UTC ou mantém local? new Date(y,m,d) cria local.
      // toISOString() converte para UTC.
      // Para consistência de prefixo YYYY-MM, toISOString é seguro se o fuso não mudar o mês.
      // Melhor garantir YYYY-MM-DD via string template para evitar problemas de fuso convertendo dia 01 apra dia 30 anterior.
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    }
  } catch (e) {
    console.warn('Falha ao converter data:', dateStr);
  }

  // Fallback
  return new Date().toISOString();
};

export const uploadData = async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const { type, data, month } = req.body;

    console.log(`[Upload] Received upload request for team ${teamId}`);
    console.log(`[Upload] Type: ${type}, Month: ${month}, Data length: ${data?.length}`);

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    if (type === 'tickets') {
      // Limpa tickets existentes do time (ou do mês específico) para evitar duplicatas
      if (month) {
        await prisma.ticket.deleteMany({
          where: { userId: teamId, dataAbertura: { startsWith: month } }
        });
      } else {
        await prisma.ticket.deleteMany({ where: { userId: teamId } });
      }

      const ticketsToCreate = data.map((t: any) => ({
        userId: teamId,
        originalId: String(t['ID'] || t['id'] || t['originalId'] || ''),
        titulo: String(t['Título'] || t['titulo'] || 'Sem Título'),
        status: String(t['Status'] || t['status'] || 'Desconhecido'),
        dataAbertura: formatDateToISO(String(t['Data de abertura'] || t['dataAbertura'] || '')),
        requerente: String(t['Requerente - Requerente'] || t['requerente'] || ''),
        tecnico: String(t['Atribuído - Técnico'] || t['tecnico'] || ''),
        categoria: String(t['Categoria'] || t['categoria'] || ''),
        origem: String(t['Origem da requisição'] || t['origem'] || ''),
        localizacao: String(t['Localização'] || t['localizacao'] || '')
      }));

      if (ticketsToCreate.length > 0) {
        console.log('Sample processed ticket:', ticketsToCreate[0]);
      }

      const result = await prisma.ticket.createMany({ data: ticketsToCreate });
      return res.json({ success: true, count: result.count });
    }

    if (type === 'chamados') {
      // Limpa chamados existentes do time (ou do mês específico)
      if (month) {
        await prisma.chamado.deleteMany({
          where: { userId: teamId, criado: { startsWith: month } }
        });
      } else {
        await prisma.chamado.deleteMany({ where: { userId: teamId } });
      }

      const chamadosToCreate = data.map((c: any) => ({
        userId: teamId,
        numeroChamado: String(c['Numero'] || c['numeroChamado'] || ''),
        resumo: String(c['Resumo'] || c['resumo'] || ''),
        statusChamado: String(c['Status'] || c['statusChamado'] || 'Aberto'),
        criado: formatDateToISO(String(c['Criado'] || c['criado'] || '')),
        fimDoPrazo: String(c['Fim do prazo'] || c['fimDoPrazo'] || ''),
        prazoAjustado: String(c['Prazo ajustado'] || c['prazoAjustado'] || ''),
        relator: String(c['Relator'] || c['relator'] || ''),
        modulo: String(c['Modulo'] || c['modulo'] || ''),
        funcionalidade: String(c['Funcionalidade'] || c['funcionalidade'] || '')
      }));

      if (chamadosToCreate.length > 0) {
        console.log('Sample processed chamado:', chamadosToCreate[0]);
      }

      const result = await prisma.chamado.createMany({ data: chamadosToCreate });
      return res.json({ success: true, count: result.count });
    }

    res.status(400).json({ error: 'Invalid type. Use "tickets" or "chamados".' });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetTeamData = async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const month = req.query.month ? String(req.query.month) : null;

    if (!month) {
      return res.status(400).json({ error: 'Mês é obrigatório para limpeza de dados.' });
    }

    // Deleta Tickets do Mês
    await prisma.ticket.deleteMany({
      where: { userId: teamId, dataAbertura: { startsWith: month } }
    });

    // Deleta Chamados do Mês
    await prisma.chamado.deleteMany({
      where: { userId: teamId, criado: { startsWith: month } }
    });

    // Deleta MonthlyData do Mês
    await prisma.monthlyData.deleteMany({
      where: { userId: teamId, month: month }
    });

    console.log(`[Reset] Data cleared for team ${teamId}, month ${month}`);
    res.json({ success: true, message: `Dados de ${month} limpos com sucesso.` });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Erro ao limpar dados do mês.' });
  }
};
