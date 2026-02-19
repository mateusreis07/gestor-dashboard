import type { Ticket, Team, Manager } from './types';

const TEAMS_KEY = 'gestor_dashboard_teams';
const TICKETS_KEY_PREFIX = 'gestor_dashboard_tickets_';
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

    // Also remove that team's data
    localStorage.removeItem(`${TICKETS_KEY_PREFIX}${teamId}`);
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


// --- Ticket Management (Per Team) ---

export const loadTeamTickets = (teamId: string): Ticket[] => {
    try {
        const raw = localStorage.getItem(`${TICKETS_KEY_PREFIX}${teamId}`);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (error) {
        console.error(`Failed to load tickets for team ${teamId}`, error);
        return [];
    }
};

export const saveTeamTickets = (teamId: string, tickets: Ticket[]) => {
    try {
        localStorage.setItem(`${TICKETS_KEY_PREFIX}${teamId}`, JSON.stringify(tickets));
    } catch (error) {
        console.error(`Failed to save tickets for team ${teamId}`, error);
        alert('Erro: Não foi possível salvar os dados (Espaço insuficiente no navegador).');
    }
};

export const clearTeamTickets = (teamId: string) => {
    localStorage.removeItem(`${TICKETS_KEY_PREFIX}${teamId}`);
};
