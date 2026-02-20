import Papa from 'papaparse';
import type { Ticket, OriginData, CategoryData, RequesterData, HistoryData } from './types';

export const parseCSV = (file: File): Promise<Ticket[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse<Ticket>(file, {
            header: true,
            skipEmptyLines: 'greedy',
            transformHeader: (header: string) => header.trim(),
            complete: (results) => {
                console.log('[CSV Parser Debug] Meta:', results.meta);
                if (results.data.length > 0) {
                    console.log('[CSV Parser Debug] First row raw:', results.data[0]);
                    console.log('[CSV Parser Debug] Keys:', Object.keys(results.data[0]));
                }

                // Flexible check for ID field to handle case variations or BOM issues
                const cleanData = results.data.filter(row => {
                    const r = row as any;
                    return r.ID || r.id || r.Id || r['﻿ID']; // Handle potential BOM
                });

                console.log('[CSV Parser Debug] Raw rows:', results.data.length);
                console.log('[CSV Parser Debug] Clean rows (with ID):', cleanData.length);

                if (cleanData.length === 0 && results.data.length > 0) {
                    console.warn('[CSV Parser Warning] No rows passed ID filter! Checking first row keys again:', Object.keys(results.data[0]));
                }

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

    // Check if it's already an ISO string directly parseable
    if (dateStr.includes('T') || dateStr.includes('-')) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
    }

    let date: Date | null = null;

    // Try parsing assuming DD/MM/YYYY first (common in Brazil)
    const parts = dateStr.split(/[-/ ]/);
    if (parts.length >= 3) {
        // Check if first part is Year (YYYY)
        if (parts[0].length === 4) {
            // YYYY-MM-DD
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) date = d;
        } else {
            // Assume DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS Month is 0-indexed
            const year = parseInt(parts[2], 10);

            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                date = new Date(year, month, day);
            }
        }
    }

    if (date && !isNaN(date.getTime())) return date;

    // Last resort
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) ? d : null;
};

export const filterTicketsByMonth = (tickets: Ticket[], monthIndex: number): Ticket[] => {
    return tickets.filter(ticket => {
        const dateStr = ticket["Data de abertura"] || (ticket as any).dataAbertura;
        if (!dateStr) return false;
        const date = parseTicketDate(dateStr);
        return date && date.getMonth() === monthIndex;
    });
};

export const filterTicketsByDateRange = (tickets: Ticket[], startDate: Date | null, endDate: Date | null): Ticket[] => {
    if (!startDate && !endDate) return tickets;

    return tickets.filter(ticket => {
        const dateStr = ticket["Data de abertura"] || (ticket as any).dataAbertura;
        if (!dateStr) return false;
        const date = parseTicketDate(dateStr);
        if (!date) return false;

        // Reset times to compare dates only
        const d = new Date(date).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
    });
};

export const getOriginStats = (tickets: Ticket[]): OriginData[] => {
    const counts: Record<string, number> = {};

    tickets.forEach(ticket => {
        const rawOrigin = ticket["Origem da requisição"] || (ticket as any).origem;
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
        const rawCategory = ticket["Categoria"] || (ticket as any).categoria;
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
        const rawRequester = ticket["Requerente - Requerente"] || (ticket as any).requerente;
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
        const dateStr = ticket["Data de abertura"] || (ticket as any).dataAbertura;

        // Tenta extrair mês direto da string se for ISO/YYYY-MM-DD para evitar problemas de fuso horário
        // Ex: 2026-01-01T00:00:00.000Z -> Mês 01 (Janeiro)
        // Se converter para Date, vira 31/12/2025 (Dezembro) no Brasil
        if (dateStr && (dateStr.includes('-'))) {
            const parts = dateStr.includes('T') ? dateStr.split('T')[0].split('-') : dateStr.split('-');
            if (parts.length >= 2 && parts[0].length === 4) {
                const monthIndex = parseInt(parts[1], 10) - 1;
                if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11) {
                    counts[monthIndex] = (counts[monthIndex] || 0) + 1;
                    return;
                }
            }
        }

        const date = parseTicketDate(dateStr);
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
