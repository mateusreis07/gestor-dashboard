
import type { Ticket, Team, Manager, Chamado } from './types';

const TEAMS_KEY = 'gestor_dashboard_teams';
// Legacy/Default keys (fallback)
const TICKETS_KEY_PREFIX = 'gestor_dashboard_tickets_';
const CHAMADOS_KEY_PREFIX = 'gestor_dashboard_chamados_';
const MANAGER_KEY = 'gestor_dashboard_manager';

// --- Manager Management ---

export const loadManager = (): Manager | null => {
    try {
        const raw = localStorage.getItem(MANAGER_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.error('Failed to load manager', error);
        return null;
    }
};

export const saveManager = (manager: Manager) => {
    try {
        localStorage.setItem(MANAGER_KEY, JSON.stringify(manager));
    } catch (error) {
        console.error('Failed to save manager', error);
        alert('Erro ao salvar dados do gestor.');
    }
};

export const clearManager = () => {
    localStorage.removeItem(MANAGER_KEY);
};

// --- Team Management ---

export const loadTeams = (): Team[] => {
    try {
        const raw = localStorage.getItem(TEAMS_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (error) {
        console.error('Failed to load teams', error);
        return [];
    }
};

export const saveTeams = (teams: Team[]) => {
    try {
        localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
    } catch (error) {
        console.error('Failed to save teams', error);
    }
};

export const addTeam = (name: string, email: string, password?: string): Team => {
    const teams = loadTeams();
    const newTeam: Team = {
        id: crypto.randomUUID(),
        name,
        email,
        password,
        createdAt: Date.now()
    };
    teams.push(newTeam);
    saveTeams(teams);
    return newTeam;
};

export const deleteTeam = (teamId: string) => {
    const teams = loadTeams();
    const updatedTeams = teams.filter(t => t.id !== teamId);
    saveTeams(updatedTeams);

    // Remove legacy data
    localStorage.removeItem(`${TICKETS_KEY_PREFIX}${teamId}`);
    localStorage.removeItem(`${CHAMADOS_KEY_PREFIX}${teamId}`);

    // Remove month-based data
    // We can't easily iterate all keys without a prefix pattern match,
    // but typically we'd loop clear related keys. For now, basic cleanup.
};

export const updateTeam = (teamId: string, data: { name?: string; email?: string; password?: string }) => {
    const teams = loadTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) return null;

    if (data.name !== undefined) teams[index].name = data.name;
    if (data.email !== undefined) teams[index].email = data.email;
    if (data.password !== undefined) teams[index].password = data.password;

    saveTeams(teams);
    return teams[index];
};


// --- MONTH-BASED DATA MANAGEMENT ---
// New Utils for Month Handling

export const getMonthKey = (teamId: string, month: string): string => {
    // month format: YYYY-MM
    return `gestor_data_${teamId}_${month}`;
};

export interface MonthData {
    tickets: Ticket[];
    chamados: Chamado[];
    chamadosMonth?: number; // Legacy support or specific ref
    manualStats?: {
        satisfaction: string;
        manuals: string;
    };
    updatedAt: number;
}

export const saveMonthData = (teamId: string, month: string, data: Partial<MonthData>) => {
    try {
        const key = getMonthKey(teamId, month);
        const existingRaw = localStorage.getItem(key);
        const existing = existingRaw ? JSON.parse(existingRaw) : { tickets: [], chamados: [] };

        const newData = {
            ...existing,
            ...data,
            updatedAt: Date.now()
        };

        localStorage.setItem(key, JSON.stringify(newData));

        // Update list of available months for this team
        const monthsKey = `gestor_months_${teamId}`;
        const monthsRaw = localStorage.getItem(monthsKey);
        const months = monthsRaw ? JSON.parse(monthsRaw) : [];
        if (!months.includes(month)) {
            months.push(month);
            months.sort().reverse(); // Newest first
            localStorage.setItem(monthsKey, JSON.stringify(months));
        }

    } catch (error) {
        console.error('Failed to save month data', error);
        alert('Erro: Espaço insuficiente para salvar os dados.');
    }
};

export const loadMonthData = (teamId: string, month: string): MonthData | null => {
    const key = getMonthKey(teamId, month);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
};

export const getAvailableMonths = (teamId: string): string[] => {
    const monthsKey = `gestor_months_${teamId}`;
    const raw = localStorage.getItem(monthsKey);
    return raw ? JSON.parse(raw) : [];
};


// --- LEGACY ADAPTERS (Keep specifically to avoid breaking current view until migration) ---

export const loadTeamTickets = (teamId: string): Ticket[] => {
    // Try to load from "current selected month" or legacy key
    // For now, let's keep using the legacy key for "Default/Current" view if no specific month logic exists yet
    const raw = localStorage.getItem(`${TICKETS_KEY_PREFIX}${teamId}`);
    return raw ? JSON.parse(raw) : [];
};

export const saveTeamTickets = (teamId: string, tickets: Ticket[]) => {
    localStorage.setItem(`${TICKETS_KEY_PREFIX}${teamId}`, JSON.stringify(tickets));
};

export const loadTeamChamados = (teamId: string): any => {
    const raw = localStorage.getItem(`${CHAMADOS_KEY_PREFIX}${teamId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { month: new Date().getMonth(), chamados: parsed };
    return parsed;
};

export const saveTeamChamados = (teamId: string, month: number, chamados: Chamado[]) => {
    const data = { month, chamados };
    localStorage.setItem(`${CHAMADOS_KEY_PREFIX}${teamId}`, JSON.stringify(data));
};

export const clearTeamTickets = (teamId: string) => localStorage.removeItem(`${TICKETS_KEY_PREFIX}${teamId}`);
export const clearTeamChamados = (teamId: string) => localStorage.removeItem(`${CHAMADOS_KEY_PREFIX}${teamId}`);
