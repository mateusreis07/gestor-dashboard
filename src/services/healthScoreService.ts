import api from './api';

export interface HealthScoreConfigData {
  id?: number;
  userId?: string;
  active?: boolean;
  version?: number;
  useSLA: boolean;
  weightSLA: number;
  weightTMA: number;
  weightBacklog: number;
  weightCapac: number;
  weightProd: number;
  weightSatis: number;
  targetTMAHours: number;
  criticalTMAHours: number;
  targetBacklog: number;
  criticalBacklog: number;
  targetProdPerTech: number;
  avgCapacityPerTech: number;
}

export interface HealthScoreHistoryData {
  scoreTotal: number;
  scoreSLA: number | null;
  scoreTMA: number;
  scoreBacklog: number;
  scoreCapacidade: number;
  scoreProdutiv: number;
  rawTicketsCount: number;
  rawChamadosCount: number;
  rawTMAHours: number;
  rawBacklogCount: number;
  rawProdTickets: number;
}

export const healthScoreService = {
  getScore: async (teamId: string, month: string) => {
    const res = await api.get(`teams/${teamId}/health-score?month=${month}`);
    return res.data;
  },

  recalculateScore: async (teamId: string, month: string) => {
    const res = await api.post(`teams/${teamId}/health-score/recalculate`, { month });
    return res.data;
  },

  getConfig: async (teamId: string): Promise<HealthScoreConfigData> => {
    const res = await api.get(`teams/${teamId}/health-score/config`);
    return res.data;
  },

  updateConfig: async (teamId: string, config: Partial<HealthScoreConfigData>) => {
    const res = await api.put(`teams/${teamId}/health-score/config`, config);
    return res.data.config;
  }
};
