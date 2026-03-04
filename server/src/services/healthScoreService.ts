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

// Helper to parse dates stored as strings in our database
function parseDateStrings(d1: string, d2?: string | null): number {
  if (!d1 || !d2) return 0;
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
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

  // TMA (Tempo Médio de Atendimento) Focuses on GLPI tickets for now
  let totalHours = 0;
  let validTMACount = 0;

  tickets.forEach(t => {
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
