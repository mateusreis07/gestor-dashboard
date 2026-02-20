import * as XLSX from 'xlsx';
import type { Chamado } from './types';

/**
 * Parse an .xlsx file and extract Chamado data.
 * Expected columns: "Nº Chamado", "Resumo", "Criado", "Fim do prazo",
 * "Prazo Ajustado", "Status do chamado", "Relator", "Módulo", "Funcionalidade"
 */
export function parseXlsx(file: File): Promise<Chamado[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Use the first sheet
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON (array of objects)
                // Use raw: false so Excel dates are parsed as the exact formatted string shown in the UI
                const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

                if (rows.length === 0) {
                    reject(new Error('A planilha está vazia.'));
                    return;
                }

                console.log('[XLSX Parser Debug] First row raw:', rows[0]);
                console.log('[XLSX Parser Debug] Keys:', Object.keys(rows[0]));

                const chamados: Chamado[] = rows.map((row) => ({
                    numeroChamado: String(row['Nº Chamado'] ?? row['N° Chamado'] ?? row['No Chamado'] ?? ''),
                    resumo: String(row['Resumo'] ?? ''),
                    criado: String(row['Criado'] ?? ''),
                    fimDoPrazo: String(row['Fim do prazo'] ?? row['Fim do Prazo'] ?? ''),
                    prazoAjustado: String(row['Prazo Ajustado'] ?? ''),
                    statusChamado: String(row['Status do chamado'] ?? row['Status do Chamado'] ?? ''),
                    relator: String(row['Relator'] ?? ''),
                    modulo: String(row['Módulo'] ?? row['Modulo'] ?? ''),
                    funcionalidade: String(row['Funcionalidade'] ?? ''),
                }));

                // Filter out rows where numeroChamado is empty (header/empty rows)
                const validChamados = chamados.filter(c => c.numeroChamado && c.numeroChamado !== 'undefined');

                resolve(validChamados);
            } catch (err) {
                reject(new Error('Erro ao processar a planilha XLSX.'));
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
        reader.readAsArrayBuffer(file);
    });
}

export function filterChamadosByDateRange(chamados: Chamado[], startDate: Date | null, endDate: Date | null): Chamado[] {
    if (!startDate && !endDate) return chamados;

    const startStr = startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` : null;
    const endStr = endDate ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` : null;


    return chamados.filter(chamado => {
        const dateStr = chamado.criado;
        if (!dateStr) return false;

        let chamadoIsoStr = "";
        if (dateStr.includes('T')) {
            chamadoIsoStr = dateStr.split('T')[0];
        } else {
            const parts = dateStr.split(/[-/ ]/);
            if (parts.length >= 3) {
                if (parts[0].length === 4) chamadoIsoStr = `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
                else chamadoIsoStr = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
            }
        }

        if (!chamadoIsoStr) return false;

        if (startStr && chamadoIsoStr < startStr) return false;
        if (endStr && chamadoIsoStr > endStr) return false;

        return true;
    });
}

/**
 * Get status distribution from chamados
 */
export function getStatusStats(chamados: Chamado[]): { name: string; value: number; color: string }[] {
    const statusMap = new Map<string, number>();

    chamados.forEach(c => {
        const status = c.statusChamado.trim() || 'Sem Status';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statusColors: Record<string, string> = {
        'Aberto': '#3b82f6',
        'Em andamento': '#f59e0b',
        'Em Andamento': '#f59e0b',
        'Resolvido': '#22c55e',
        'Fechado': '#6b7280',
        'Cancelado': '#ef4444',
        'Pendente': '#f97316',
        'Aguardando': '#8b5cf6',
    };

    const defaultColors = ['#0ea5e9', '#14b8a6', '#f43f5e', '#a855f7', '#eab308', '#64748b', '#06b6d4', '#84cc16'];
    let colorIndex = 0;

    return Array.from(statusMap.entries())
        .map(([name, value]) => ({
            name,
            value,
            color: statusColors[name] || defaultColors[colorIndex++ % defaultColors.length],
        }))
        .sort((a, b) => b.value - a.value);
}

/**
 * Get functionality distribution from chamados (Top 10)
 */
export function getFuncionalidadeStats(chamados: Chamado[]): { name: string; value: number }[] {
    const funcMap = new Map<string, number>();

    chamados.forEach(c => {
        const func = c.funcionalidade.trim() || 'Não Especificada';
        funcMap.set(func, (funcMap.get(func) || 0) + 1);
    });

    return Array.from(funcMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
}
