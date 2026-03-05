import { prisma } from '../prisma';

export async function getOrCreateConfig(userId: string) {
  let config = await prisma.healthScoreConfig.findFirst({
    where: { userId, active: true },
    orderBy: { version: 'desc' }
  });

  if (!config) {
    config = await prisma.healthScoreConfig.create({
      data: {
        userId,
        targetTMAHours: 24,
        criticalTMAHours: 72,
        targetBacklog: 20,
        criticalBacklog: 100,
        targetProdPerTech: 50,
        avgCapacityPerTech: 60,
        useSLA: false,
        weightSLA: 0.25,
        weightTMA: 0.20,
        weightBacklog: 0.25,
        weightCapac: 0.15,
        weightProd: 0.15,
      }
    });
  }
  return config;
}

export async function saveConfig(userId: string, data: Partial<import('@prisma/client').HealthScoreConfig>) {
  const current = await getOrCreateConfig(userId);

  // Deactivate current
  await prisma.healthScoreConfig.update({
    where: { id: current.id },
    data: { active: false }
  });

  // Create new version
  const newConfig = await prisma.healthScoreConfig.create({
    data: {
      ...current,
      ...data,
      id: undefined, // Let auto-increment handle it
      version: current.version + 1,
      active: true,
      updatedAt: undefined,
      createdAt: undefined
    } as any // Ignoring ts strictness on omitted properties for brevity
  });

  return newConfig;
}

function normalizeScore(val: number, target: number, critical: number, inverse: boolean = false): number {
  if (target === critical) return 100;

  let score = 0;
  if (!inverse) {
    // Normal: higher is better (e.g. Productivity)
    if (val >= target) score = 100;
    else if (val <= critical) score = 0;
    else score = ((val - critical) / (target - critical)) * 100;
  } else {
    // Inverse: lower is better (e.g. TMA, Backlog)
    if (val <= target) score = 100;
    else if (val >= critical) score = 0;
    else score = ((critical - val) / (critical - target)) * 100;
  }

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

// Helper to parse dates stored as strings in our database (GLPI often exports DD/MM/YYYY HH:mm)
function parseDateStrings(d1: string, d2?: string | null): number {
  if (!d1 || !d2) return 0;

  const parseSingleDate = (dateStr: string): number => {
    // 1. Check if ISO or standard YYYY-MM-DD
    if (dateStr.includes('T') || (dateStr.includes('-') && dateStr.split(' ')[0].split('-')[0].length === 4)) {
      return new Date(dateStr).getTime();
    }

    // 2. Parse pt-BR formats (DD/MM/YYYY HH:mm:ss or similar)
    const parts = dateStr.split(/[-/ ]/);
    if (parts.length >= 3 && parts[0].length <= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
        let hours = 0, minutes = 0, seconds = 0;
        if (dateStr.includes(':')) {
          const timePart = dateStr.split(' ')[1];
          if (timePart) {
            const timeTokens = timePart.split(':');
            hours = parseInt(timeTokens[0], 10) || 0;
            minutes = parseInt(timeTokens[1], 10) || 0;
            seconds = parseInt(timeTokens[2], 10) || 0;
          }
        }
        return new Date(year, month, day, hours, minutes, seconds).getTime();
      }
    }

    // 3. Fallback
    return new Date(dateStr).getTime();
  };

  const t1 = parseSingleDate(d1);
  const t2 = parseSingleDate(d2);

  if (isNaN(t1) || isNaN(t2)) return 0;
  return Math.abs(t2 - t1) / (1000 * 60 * 60); // Difference in hours
}

export async function calculateAndSaveHealthScore(userId: string, month: string) {
  const config = await getOrCreateConfig(userId);

  // 1. Fetch Raw Data
  const dateFilter = { startsWith: String(month) };

  const tickets = await prisma.ticket.findMany({
    where: { userId, dataAbertura: dateFilter }
  });

  const chamados = await prisma.chamado.findMany({
    where: { userId, criado: dateFilter }
  });

  const rawTicketsCount = tickets.length;
  const rawChamadosCount = chamados.length;

  if (rawTicketsCount === 0 && rawChamadosCount === 0) {
    throw new Error('No data found for the given month');
  }

  // 2. Compute Aggregates
  const closedStatuses = ['resolvido', 'fechado', 'concluído', 'concluido'];
  const tmaValidOrigins = ['helpdesk', 'formcreator'];

  // TMA (Tempo Médio de Atendimento) - Only Helpdesk & Formcreator origins (real user tickets)
  let totalHours = 0;
  let validTMACount = 0;

  tickets.forEach(t => {
    const origem = (t.origem || '').trim().toLowerCase();
    if (!tmaValidOrigins.includes(origem)) return;
    if (t.ultimaAtualizacao && t.dataAbertura) {
      const hours = parseDateStrings(t.dataAbertura, t.ultimaAtualizacao);
      if (hours > 0) {
        totalHours += hours;
        validTMACount++;
      }
    }
  });

  const rawTMAHours = validTMACount > 0 ? (totalHours / validTMACount) : 0;

  // Backlog
  let rawBacklogCount = 0;
  tickets.forEach(t => {
    if (!closedStatuses.includes(t.status.trim().toLowerCase())) rawBacklogCount++;
  });
  chamados.forEach(c => {
    if (!closedStatuses.includes(c.statusChamado.trim().toLowerCase())) rawBacklogCount++;
  });

  // Productivity (Closed tickets/chamados)
  let rawClosedCount = 0;
  const technicians = new Set<string>();

  tickets.forEach(t => {
    if (closedStatuses.includes(t.status.trim().toLowerCase())) rawClosedCount++;
    if (t.tecnico && t.tecnico !== '-') technicians.add(t.tecnico.trim());
  });
  chamados.forEach(c => {
    if (closedStatuses.includes(c.statusChamado.trim().toLowerCase())) rawClosedCount++;
    if (c.relator && c.relator !== '-') technicians.add(c.relator.trim());
  });

  const techCount = technicians.size || 1; // Avoid division by zero
  const rawProdTickets = rawClosedCount / techCount;
  const currentCapacity = techCount * config.avgCapacityPerTech; // System total capacity

  // Volume is the total number of incoming requests (Indice de Carga = Volume / Capacidade)
  const totalVolume = rawTicketsCount + rawChamadosCount;
  const utilizedCapacity = (totalVolume / currentCapacity) * 100;

  // 3. Normalize Scores (0-100)
  const scoreTMA = normalizeScore(rawTMAHours, config.targetTMAHours, config.criticalTMAHours, true);
  const scoreBacklog = normalizeScore(rawBacklogCount, config.targetBacklog, config.criticalBacklog, true);

  // Productivity normalizes based on the per-tech target (starts from 0)
  const scoreProdutiv = normalizeScore(rawProdTickets, config.targetProdPerTech, 0, false);

  // Capacity usage normalizes around 100%. (<= 100% capacity used is score 100, >= 130% is score 0)
  const scoreCapacidade = normalizeScore(utilizedCapacity, 100, 130, true);

  // SLA is optional
  const scoreSLA = config.useSLA ? 100 : null; // Pending real SLA data logic, returning 100 mock for now

  // 4. Compute Final Weighted Health Score
  let scoreTotal = 0;

  if (config.useSLA && scoreSLA !== null) {
    scoreTotal =
      (scoreSLA * config.weightSLA) +
      (scoreTMA * config.weightTMA) +
      (scoreBacklog * config.weightBacklog) +
      (scoreCapacidade * config.weightCapac) +
      (scoreProdutiv * config.weightProd);
  } else {
    // Redistribute weights if SLA is disabled
    const totalCurrentWeight = config.weightTMA + config.weightBacklog + config.weightCapac + config.weightProd;
    const factor = 1 / totalCurrentWeight;

    scoreTotal =
      (scoreTMA * config.weightTMA * factor) +
      (scoreBacklog * config.weightBacklog * factor) +
      (scoreCapacidade * config.weightCapac * factor) +
      (scoreProdutiv * config.weightProd * factor);
  }

  scoreTotal = Math.max(0, Math.min(100, Math.round(scoreTotal * 10) / 10));

  // 5. Save Snapshot to History
  const history = await prisma.healthScoreHistory.upsert({
    where: {
      userId_month_configVersion: {
        userId,
        month,
        configVersion: config.version
      }
    },
    update: {
      scoreTotal,
      scoreSLA,
      scoreTMA,
      scoreBacklog,
      scoreCapacidade,
      scoreProdutiv,
      rawTicketsCount,
      rawChamadosCount,
      rawTMAHours,
      rawBacklogCount,
      rawProdTickets
    },
    create: {
      userId,
      month,
      configVersion: config.version,
      scoreTotal,
      scoreSLA,
      scoreTMA,
      scoreBacklog,
      scoreCapacidade,
      scoreProdutiv,
      rawTicketsCount,
      rawChamadosCount,
      rawTMAHours,
      rawBacklogCount,
      rawProdTickets
    }
  });

  return history;
}

export async function getHealthScoreHistory(userId: string, month: string) {
  // Always try to fetch the latest config snapshot
  const config = await getOrCreateConfig(userId);

  let history = await prisma.healthScoreHistory.findUnique({
    where: {
      userId_month_configVersion: {
        userId,
        month,
        configVersion: config.version
      }
    }
  });

  if (!history) {
    try {
      // Auto-calculate if data exists but not calculated yet
      history = await calculateAndSaveHealthScore(userId, month);
    } catch (e) {
      return null;
    }
  }

  return { history, config };
}

export async function getHealthScoreDetails(userId: string, month: string) {
  const config = await getOrCreateConfig(userId);

  // 1. Fetch Raw Data
  const dateFilter = { startsWith: String(month) };
  const tickets = await prisma.ticket.findMany({ where: { userId, dataAbertura: dateFilter } });
  const chamados = await prisma.chamado.findMany({ where: { userId, criado: dateFilter } });

  const rawTicketsCount = tickets.length;
  const rawChamadosCount = chamados.length;

  if (rawTicketsCount === 0 && rawChamadosCount === 0) {
    return null;
  }

  // 2. Compute Aggregates
  const closedStatuses = ['resolvido', 'fechado', 'concluído', 'concluido'];
  const tmaValidOrigins = ['helpdesk', 'formcreator'];
  let totalHours = 0;
  let validTMACount = 0;
  let rawBacklogCount = 0;
  let rawClosedCount = 0;
  const technicians = new Set<string>();

  tickets.forEach(t => {
    const isClosed = closedStatuses.includes(t.status.trim().toLowerCase());
    // TMA: only Helpdesk & Formcreator origins (real user tickets)
    const origem = (t.origem || '').trim().toLowerCase();
    if (tmaValidOrigins.includes(origem) && t.ultimaAtualizacao && t.dataAbertura) {
      const hours = parseDateStrings(t.dataAbertura, t.ultimaAtualizacao);
      if (hours > 0) { totalHours += hours; validTMACount++; }
    }
    if (!isClosed) rawBacklogCount++;
    if (isClosed) rawClosedCount++;
    if (t.tecnico && t.tecnico !== '-') technicians.add(t.tecnico.trim());
  });

  chamados.forEach(c => {
    const isClosed = closedStatuses.includes(c.statusChamado.trim().toLowerCase());
    if (!isClosed) rawBacklogCount++;
    if (isClosed) rawClosedCount++;
    if (c.relator && c.relator !== '-') technicians.add(c.relator.trim());
  });

  const techCount = technicians.size || 1;
  const rawTMAHours = validTMACount > 0 ? (totalHours / validTMACount) : 0;
  const rawProdTickets = rawClosedCount / techCount;
  const currentCapacity = techCount * config.avgCapacityPerTech;
  const totalVolume = rawTicketsCount + rawChamadosCount;
  const utilizedCapacity = (totalVolume / currentCapacity) * 100;

  // 3. Normalize Scores
  const scoreTMA = normalizeScore(rawTMAHours, config.targetTMAHours, config.criticalTMAHours, true);
  const scoreBacklog = normalizeScore(rawBacklogCount, config.targetBacklog, config.criticalBacklog, true);
  const scoreProdutiv = normalizeScore(rawProdTickets, config.targetProdPerTech, 0, false);
  const scoreCapacidade = normalizeScore(utilizedCapacity, 100, 130, true);
  const scoreSLA = config.useSLA ? 100 : null; // Pending actual SLA tracking

  // 4. Detailed Evaluation
  const totalCurrentWeight = config.useSLA
    ? 1
    : (config.weightTMA + config.weightBacklog + config.weightCapac + config.weightProd);
  const factor = config.useSLA ? 1 : (1 / totalCurrentWeight);

  const effectiveWeights = {
    sla: config.useSLA ? config.weightSLA : 0,
    tma: config.useSLA ? config.weightTMA : config.weightTMA * factor,
    backlog: config.useSLA ? config.weightBacklog : config.weightBacklog * factor,
    capacidade: config.useSLA ? config.weightCapac : config.weightCapac * factor,
    produtividade: config.useSLA ? config.weightProd : config.weightProd * factor,
  };

  let finalScore =
    ((scoreSLA || 0) * effectiveWeights.sla) +
    (scoreTMA * effectiveWeights.tma) +
    (scoreBacklog * effectiveWeights.backlog) +
    (scoreCapacidade * effectiveWeights.capacidade) +
    (scoreProdutiv * effectiveWeights.produtividade);
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore * 10) / 10));

  const pillars = {
    sla: {
      active: config.useSLA,
      score: scoreSLA || 0,
      effectiveWeight: effectiveWeights.sla,
      raw: { value: 100, target: 100 },
      contribution: (scoreSLA || 0) * effectiveWeights.sla,
      formula: "Simples percentual de tickets resolvidos no prazo (Em breve: leitura real de logs).",
      calculationSteps: [],
      notes: ["O módulo de SLA está em desenvolvimento. Atualmente retorna 100 como placeholder."],
    },
    tma: {
      score: scoreTMA,
      effectiveWeight: effectiveWeights.tma,
      raw: {
        value: rawTMAHours,
        target: config.targetTMAHours,
        critical: config.criticalTMAHours,
        validTickets: validTMACount,
        totalImported: rawTicketsCount,
      },
      contribution: scoreTMA * effectiveWeights.tma,
      formula: "score = ((Crítico - ValorAtual) / (Crítico - Alvo)) × 100",
      calculationSteps: [
        `1. Total de tickets importados no mês: ${rawTicketsCount}`,
        `2. Filtro de origem aplicado: apenas "Helpdesk" e "Formcreator" (tickets abertos diretamente por usuários)`,
        `3. Tickets válidos após filtro (com datas de abertura e última atualização): ${validTMACount}`,
        `4. Soma total de horas de atendimento: ${totalHours.toFixed(2)}h`,
        `5. TMA = ${totalHours.toFixed(2)}h ÷ ${validTMACount} tickets = ${rawTMAHours.toFixed(2)}h`,
        `6. Aplicação da fórmula: ((${config.criticalTMAHours} - ${rawTMAHours.toFixed(2)}) / (${config.criticalTMAHours} - ${config.targetTMAHours})) × 100`,
        `7. Resultado bruto: ${(((config.criticalTMAHours - rawTMAHours) / (config.criticalTMAHours - config.targetTMAHours)) * 100).toFixed(2)}`,
        `8. Nota final (limitada 0-100): ${scoreTMA}`,
      ],
      notes: [
        'São contabilizados apenas tickets com origem "Helpdesk" e "Formcreator", pois são os chamados abertos diretamente por usuários no sistema GLPI.',
        'Tickets com origem "Atendimento presencial", "Globalbot", "Monitoramento" e "Phone" são excluídos por serem registros manuais da equipe, cujas datas não refletem o ciclo real de atendimento.',
        'O TMA é calculado pela diferença entre a "Data de abertura" e a "Última atualização" de cada ticket.',
        `Peso configurado: ${(effectiveWeights.tma * 100).toFixed(1)}% → Contribuição máxima possível: ${(effectiveWeights.tma * 100).toFixed(1)} pontos.`,
      ],
    },
    backlog: {
      score: scoreBacklog,
      effectiveWeight: effectiveWeights.backlog,
      raw: {
        value: rawBacklogCount,
        target: config.targetBacklog,
        critical: config.criticalBacklog,
        totalImported: rawTicketsCount + rawChamadosCount,
      },
      contribution: scoreBacklog * effectiveWeights.backlog,
      formula: "score = ((Crítico - BacklogAtual) / (Crítico - Alvo)) × 100",
      calculationSteps: [
        `1. Total de itens importados (tickets + chamados): ${rawTicketsCount + rawChamadosCount}`,
        `2. Itens com status diferente de "Resolvido/Fechado/Concluído": ${rawBacklogCount}`,
        `3. Aplicação da fórmula: ((${config.criticalBacklog} - ${rawBacklogCount}) / (${config.criticalBacklog} - ${config.targetBacklog})) × 100`,
        `4. Resultado bruto: ${(((config.criticalBacklog - rawBacklogCount) / (config.criticalBacklog - config.targetBacklog)) * 100).toFixed(2)}`,
        `5. Nota final (limitada 0-100): ${scoreBacklog}`,
      ],
      notes: [
        'Backlog = todos os tickets e chamados cujo status NÃO é "Resolvido", "Fechado" ou "Concluído".',
        'Considera TODAS as origens de requisição (diferente do TMA).',
        `Peso configurado: ${(effectiveWeights.backlog * 100).toFixed(1)}% → Contribuição máxima possível: ${(effectiveWeights.backlog * 100).toFixed(1)} pontos.`,
      ],
    },
    capacidade: {
      score: scoreCapacidade,
      effectiveWeight: effectiveWeights.capacidade,
      raw: {
        techCount,
        baseCapacity: config.avgCapacityPerTech,
        totalCapacity: currentCapacity,
        totalVolume,
        utilizedPercentage: utilizedCapacity,
      },
      contribution: scoreCapacidade * effectiveWeights.capacidade,
      formula: "Índice de Carga = (Volume Total / Capacidade Total) × 100. Se ≤ 100% → Nota 100. Se ≥ 130% → Nota 0.",
      calculationSteps: [
        `1. Analistas detectados nas planilhas: ${techCount}`,
        `2. Capacidade por analista (configurada): ${config.avgCapacityPerTech} chamados/mês`,
        `3. Capacidade total da equipe: ${techCount} × ${config.avgCapacityPerTech} = ${currentCapacity}`,
        `4. Volume total entrante (tickets + chamados): ${totalVolume}`,
        `5. Índice de carga: (${totalVolume} / ${currentCapacity}) × 100 = ${utilizedCapacity.toFixed(2)}%`,
        `6. Nota final (limitada 0-100): ${scoreCapacidade}`,
      ],
      notes: [
        'Os analistas são detectados automaticamente pela coluna "Técnico" dos tickets e "Relator" dos chamados.',
        'Nomes duplicados ou com hífen "-" são desconsiderados.',
        'A capacidade por analista é configurável na tela de "Configurar Pesos".',
        `Peso configurado: ${(effectiveWeights.capacidade * 100).toFixed(1)}% → Contribuição máxima possível: ${(effectiveWeights.capacidade * 100).toFixed(1)} pontos.`,
      ],
    },
    produtividade: {
      score: scoreProdutiv,
      effectiveWeight: effectiveWeights.produtividade,
      raw: {
        closedTickets: rawClosedCount,
        techCount,
        avgPerTech: rawProdTickets,
        targetPerTech: config.targetProdPerTech,
      },
      contribution: scoreProdutiv * effectiveWeights.produtividade,
      formula: "score = (Fechados por Analista / Meta por Analista) × 100",
      calculationSteps: [
        `1. Total de tickets/chamados fechados no mês: ${rawClosedCount}`,
        `2. Analistas detectados: ${techCount}`,
        `3. Média de resolução por analista: ${rawClosedCount} ÷ ${techCount} = ${rawProdTickets.toFixed(2)}`,
        `4. Meta por analista (configurada): ${config.targetProdPerTech}`,
        `5. Aplicação da fórmula: (${rawProdTickets.toFixed(2)} / ${config.targetProdPerTech}) × 100`,
        `6. Resultado bruto: ${((rawProdTickets / config.targetProdPerTech) * 100).toFixed(2)}`,
        `7. Nota final (limitada 0-100): ${scoreProdutiv}`,
      ],
      notes: [
        'Produtividade mede quantos chamados foram efetivamente fechados por analista em relação à meta.',
        'Considera TODOS os tickets e chamados com status "Resolvido", "Fechado" ou "Concluído".',
        `Peso configurado: ${(effectiveWeights.produtividade * 100).toFixed(1)}% → Contribuição máxima possível: ${(effectiveWeights.produtividade * 100).toFixed(1)} pontos.`,
      ],
    }
  };

  // Identify offender (the active pillar with the lowest normalized score)
  let offender = '';
  let lowestScore = 101;
  for (const [key, data] of Object.entries(pillars)) {
    if (key === 'sla' && !config.useSLA) continue;
    if (data.score < lowestScore) {
      lowestScore = data.score;
      offender = key;
    }
  }

  return {
    finalScore,
    month,
    offender,
    configUsed: config,
    pillars
  };
}
