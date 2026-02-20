import api from './api';
import type { Ticket, Chamado } from '../utils/types';

export interface DashboardData {
  team: { id: string; name: string; email: string };
  tickets: Ticket[];
  chamados: Chamado[];
  manualStats: { satisfaction: string | null; manuals: string | null } | null;
  availableMonths: string[];
  history?: number[];
}

export const teamService = {
  // Busca todos os dados do dashboard de um time
  async getDashboard(teamId: string, month?: string): Promise<DashboardData> {
    const params = month ? { month } : {};
    const response = await api.get(`/teams/${teamId}/dashboard`, { params });
    return response.data;
  },

  // Salva estatísticas manuais (satisfação, manuais enviados) de um mês
  async saveManualStats(teamId: string, month: string, satisfaction: string, manuals: string) {
    const response = await api.post(`/teams/${teamId}/manual-stats`, {
      month,
      satisfaction,
      manuals,
    });
    return response.data;
  },

  // Envia array de tickets parseados do CSV para salvar no banco
  async uploadTickets(teamId: string, tickets: any[], month?: string) {
    const response = await api.post(`/teams/${teamId}/upload`, {
      type: 'tickets',
      data: tickets,
      month,
    });
    return response.data;
  },

  // Envia array de chamados parseados do XLSX para salvar no banco
  async uploadChamados(teamId: string, chamados: any[], month?: string) {
    const response = await api.post(`/teams/${teamId}/upload`, {
      type: 'chamados',
      data: chamados,
      month,
    });
    return response.data;
  },

  async resetData(teamId: string, month: string) {
    const response = await api.delete(`/teams/${teamId}/data?month=${month}`);
    return response.data;
  },
};

// Serviço de gerenciamento de times (apenas para gestor)
export const managerTeamsService = {
  async listTeams(): Promise<{ id: string; name: string; email: string; createdAt: string }[]> {
    const response = await api.get('/manager/teams');
    return response.data;
  },

  async createTeam(name: string, email: string, password: string) {
    const response = await api.post('/manager/teams', { name, email, password });
    return response.data;
  },

  async updateTeam(id: string, data: { name?: string; email?: string; password?: string }) {
    const response = await api.put(`/manager/teams/${id}`, data);
    return response.data;
  },

  async deleteTeam(id: string) {
    const response = await api.delete(`/manager/teams/${id}`);
    return response.data;
  },
};
