import Papa from 'papaparse';
import type { Ticket, OriginData, CategoryData, RequesterData, HistoryData } from './types';

export const parseCSV = (file: File): Promise<Ticket[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse<Ticket>(file, {
            header: true,
            skipEmptyLines: 'greedy',
            transformHeader: (header: string) => header.trim(),
            complete: (results) => {
                const cleanData = results.data.filter(row => row.ID);
                resolve(cleanData);
            },
            error: (error: Error) => {
                reject(error);
            }
        });
    });
};

export const parseTicketDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    let date: Date | null = null;

    // Try parsing assuming DD/MM/YYYY first (common in Brazil)
    const parts = dateStr.split(/[-/ ]/);
    if (parts.length >= 3) {
        // Check if first part is Year (YYYY)
        if (parts[0].length === 4) {
            date = new Date(dateStr);
        } else {
            // Assume DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS Month is 0-indexed
            const year = parseInt(parts[2], 10);

            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                date = new Date(year, month, day);
            }
        }
    } else {
        // Try standard Date parse
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            date = d;
        }
    }

    if (date && !isNaN(date.getTime())) return date;
    return null;
};

export const filterTicketsByMonth = (tickets: Ticket[], monthIndex: number): Ticket[] => {
    return tickets.filter(ticket => {
        const date = parseTicketDate(ticket["Data de abertura"]);
        return date && date.getMonth() === monthIndex;
    });
};

export const getOriginStats = (tickets: Ticket[]): OriginData[] => {
    const counts: Record<string, number> = {};

    tickets.forEach(ticket => {
        const rawOrigin = ticket["Origem da requisição"];
        if (rawOrigin) {
            const origin = rawOrigin.trim();
            counts[origin] = (counts[origin] || 0) + 1;
        }
    });

    return Object.entries(counts).map(([name, value]) => ({
        name,
        value
    })).sort((a, b) => b.value - a.value);
};

export const getCategoryStats = (tickets: Ticket[]): CategoryData[] => {
    const counts: Record<string, number> = {};

    tickets.forEach(ticket => {
        const rawCategory = ticket["Categoria"];
        if (rawCategory) {
            const category = rawCategory.replace(/^SAJMP\s*>\s*/i, '').trim();
            if (category && category !== '-') {
                counts[category] = (counts[category] || 0) + 1;
            }
        }
    });

    const sorted = Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return sorted.slice(0, 5);
};

export const getRequesterStats = (tickets: Ticket[]): RequesterData[] => {
    const counts: Record<string, number> = {};
    const excludedRequesters = new Set([
        'BRUNA CAROLINE CASTOR DA SILVA',
        'FABRICIO ANDRE BONIFÁCIO CUNHA',
        'MATEUS PEREIRA REIS',
        'Thiago Silva da Rocha',
        'Jan Roberto de Souza Ramos',
        'IAN CADORI DE SIQUEIRA'
    ].map(n => n.toLowerCase()));

    tickets.forEach(ticket => {
        const rawRequester = ticket["Requerente - Requerente"];
        if (rawRequester) {
            const requester = rawRequester.trim();
            if (requester && requester !== '-' && !excludedRequesters.has(requester.toLowerCase())) {
                counts[requester] = (counts[requester] || 0) + 1;
            }
        }
    });

    const sorted = Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return sorted.slice(0, 5);
};

export const getHistoryStats = (tickets: Ticket[]): HistoryData[] => {
    const counts: Record<number, number> = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const fullMonthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    tickets.forEach(ticket => {
        const date = parseTicketDate(ticket["Data de abertura"]);
        if (date) {
            const monthIndex = date.getMonth();
            counts[monthIndex] = (counts[monthIndex] || 0) + 1;
        }
    });

    const result: HistoryData[] = [];
    for (let i = 0; i < 12; i++) {
        result.push({
            name: monthNames[i],
            fullLabel: fullMonthNames[i],
            value: counts[i] || 0,
            order: i
        });
    }

    return result;
};
