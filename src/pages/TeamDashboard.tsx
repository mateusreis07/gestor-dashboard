import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileUpload } from '../components/Upload/FileUpload';
import { OriginChart } from '../components/Dashboard/OriginChart';
import { CategoryChart } from '../components/Dashboard/CategoryChart';
import { RequesterChart } from '../components/Dashboard/RequesterChart';
import { HistoryChart } from '../components/Dashboard/HistoryChart';
import { StatusChart } from '../components/Dashboard/StatusChart';
import { FuncionalidadeChart } from '../components/Dashboard/FuncionalidadeChart';
import {
    parseCSV,
    getOriginStats,
    getCategoryStats,
    getRequesterStats,
    getHistoryStats,
    filterTicketsByMonth,
    parseTicketDate
} from '../utils/csvParser';
import { parseXlsx, getStatusStats, getFuncionalidadeStats } from '../utils/xlsxParser';
import { loadTeams, loadTeamTickets, saveTeamTickets, clearTeamTickets, loadTeamChamados, saveTeamChamados, clearTeamChamados } from '../utils/storage';
import type { Ticket, Team, Chamado } from '../utils/types';
import { ArrowLeft, LogOut, LayoutDashboard, Users, Upload, Calendar, Trash2, FileSpreadsheet, ClipboardList } from 'lucide-react';

const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function TeamDashboard() {
    const { teamId } = useParams<{ teamId: string }>();
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();

    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [chamados, setChamados] = useState<Chamado[]>([]);
    const [chamadosMonth, setChamadosMonth] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Load team data on mount or teamId change
    useEffect(() => {
        // If no teamId in URL, try to derive it from the logged-in user
        const resolvedTeamId = teamId || (role === 'team' && user && 'id' in user ? user.id : null);

        if (!resolvedTeamId) {
            if (role === 'manager') {
                navigate('/app/overview');
            } else {
                navigate('/welcome');
            }
            return;
        }

        const teams = loadTeams();
        const team = teams.find(t => t.id === resolvedTeamId);

        if (team) {
            setCurrentTeam(team);
            const teamTickets = loadTeamTickets(team.id);
            setTickets(teamTickets);
            const chamadosData = loadTeamChamados(team.id);
            if (chamadosData) {
                setChamados(chamadosData.chamados);
                setChamadosMonth(chamadosData.month);
            }
        } else {
            if (role === 'manager') {
                navigate('/app/overview');
            } else {
                navigate('/welcome');
            }
        }
    }, [teamId, navigate, role, user]);

    // Save tickets when they change (only for team role)
    useEffect(() => {
        if (currentTeam && role === 'team') {
            saveTeamTickets(currentTeam.id, tickets);
        }
    }, [tickets, currentTeam, role]);

    // --- Data Processing ---
    const filteredTickets = useMemo(() => {
        if (selectedMonth === null) return tickets;
        return filterTicketsByMonth(tickets, selectedMonth);
    }, [tickets, selectedMonth]);

    const originData = useMemo(() => getOriginStats(filteredTickets), [filteredTickets]);
    const categoryData = useMemo(() => getCategoryStats(filteredTickets), [filteredTickets]);
    const requesterData = useMemo(() => getRequesterStats(filteredTickets), [filteredTickets]);
    const historyData = useMemo(() => getHistoryStats(tickets), [tickets]);

    // --- Chamados XLSX Data (only visible for the import month) ---
    const showChamados = chamados.length > 0 && (selectedMonth === null || selectedMonth === chamadosMonth);
    const statusData = useMemo(() => getStatusStats(chamados), [chamados]);
    const funcData = useMemo(() => getFuncionalidadeStats(chamados), [chamados]);

    // --- Handlers ---
    const handleFileSelect = async (file: File) => {
        if (role !== 'team') return;
        if (!currentTeam) return;

        setLoading(true);
        try {
            const newTickets = await parseCSV(file);

            let detectedMonth: number | null = null;
            if (newTickets.length > 0) {
                const firstDate = parseTicketDate(newTickets[0]["Data de abertura"]);
                if (firstDate) detectedMonth = firstDate.getMonth();
            }

            if (selectedMonth !== null && detectedMonth !== null && selectedMonth !== detectedMonth) {
                if (!confirm(`Atenção: Você selecionou "${months[selectedMonth]}" mas o arquivo parece conter dados de "${months[detectedMonth]}". Deseja importar mesmo assim?`)) {
                    setLoading(false);
                    return;
                }
            }

            setTickets(prevTickets => {
                const ticketMap = new Map<string, Ticket>();
                prevTickets.forEach(t => { if (t.ID) ticketMap.set(t.ID, t); });
                newTickets.forEach(t => { if (t.ID) ticketMap.set(t.ID, t); });
                return Array.from(ticketMap.values());
            });

            if (selectedMonth === null && detectedMonth !== null) {
                setSelectedMonth(detectedMonth);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao processar arquivo CSV');
        } finally {
            setLoading(false);
        }
    };

    const handleClearData = () => {
        if (currentTeam && confirm(`Limpar todos os dados do time ${currentTeam.name}?`)) {
            clearTeamTickets(currentTeam.id);
            clearTeamChamados(currentTeam.id);
            setTickets([]);
            setChamados([]);
            setChamadosMonth(null);
            setSelectedMonth(null);
        }
    };

    const handleImportClick = () => {
        document.getElementById('hidden-file-input')?.click();
    };

    const handleXlsxImportClick = () => {
        document.getElementById('hidden-xlsx-input')?.click();
    };

    const handleXlsxFileSelect = async (file: File) => {
        if (role !== 'team' || !currentTeam) return;
        setLoading(true);
        try {
            const newChamados = await parseXlsx(file);
            // Use selected month if set, otherwise current month
            const importMonth = selectedMonth !== null ? selectedMonth : new Date().getMonth();
            setChamados(newChamados);
            setChamadosMonth(importMonth);
            saveTeamChamados(currentTeam.id, importMonth, newChamados);
        } catch (error) {
            console.error(error);
            alert('Erro ao processar arquivo XLSX');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (role === 'manager') {
            navigate('/app/overview');
        } else {
            logout();
            navigate('/welcome');
        }
    };

    if (!currentTeam) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>
                Carregando...
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Back Action */}
                    {role === 'manager' ? (
                        <button onClick={handleBack} className="icon-button" title="Voltar para seleção">
                            <ArrowLeft size={20} color="#6b7280" />
                        </button>
                    ) : (
                        <button onClick={handleBack} className="icon-button" title="Sair">
                            <LogOut size={20} color="#6b7280" />
                        </button>
                    )}

                    <div style={{
                        background: role === 'manager'
                            ? 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)'
                            : 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                        padding: '10px', borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {role === 'manager' ? <LayoutDashboard color="white" size={24} /> : <Users color="white" size={24} />}
                    </div>

                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-main)', margin: 0 }}>
                            {role === 'manager' ? 'Portal do Gestor' : 'Portal do Time'}
                        </h1>
                        {user && (
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
                                Olá, <strong>{user.name}</strong>
                            </div>
                        )}
                        <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '2px' }}>
                            Visualizando: <strong style={{ color: '#374151' }}>{currentTeam.name}</strong>
                        </div>
                    </div>
                </div>

                {/* RIGHT ACTIONS */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {tickets.length > 0 && (
                        <div style={{ position: 'relative', marginRight: '4px' }}>
                            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                                <Calendar size={16} />
                            </div>
                            <select
                                value={selectedMonth === null ? -1 : selectedMonth}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setSelectedMonth(val === -1 ? null : val);
                                }}
                                className="month-select"
                                style={{
                                    appearance: 'none', padding: '8px 12px 8px 32px', borderRadius: '8px',
                                    border: '1px solid #e5e7eb', background: 'white', color: '#374151',
                                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', outline: 'none', minWidth: '150px'
                                }}
                            >
                                <option value={-1}>📆 Todo o Ano</option>
                                {months.map((m, i) => (
                                    <option key={m} value={i}>{m}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {role === 'team' && (
                        <>
                            <button
                                onClick={handleImportClick}
                                style={{
                                    background: 'white', color: '#374151', border: '1px solid #e5e7eb',
                                    padding: '8px 16px', borderRadius: '8px', fontSize: '0.875rem',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                }}
                            >
                                <Upload size={16} />
                                <span>Importar CSV</span>
                            </button>
                            <button
                                onClick={handleXlsxImportClick}
                                style={{
                                    background: 'white', color: '#374151', border: '1px solid #e5e7eb',
                                    padding: '8px 16px', borderRadius: '8px', fontSize: '0.875rem',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                }}
                            >
                                <FileSpreadsheet size={16} />
                                <span>Importar XLSX</span>
                            </button>
                            <input
                                id="hidden-file-input"
                                type="file"
                                accept=".csv"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileSelect(e.target.files[0]);
                                        e.target.value = '';
                                    }
                                }}
                                style={{ display: 'none' }}
                            />
                            <input
                                id="hidden-xlsx-input"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleXlsxFileSelect(e.target.files[0]);
                                        e.target.value = '';
                                    }
                                }}
                                style={{ display: 'none' }}
                            />
                        </>
                    )}
                </div>
            </header>

            <main className="app-content">
                {loading && <div className="loading">Carregando...</div>}

                {/* EMPTY STATE */}
                {tickets.length === 0 && (
                    <div className="upload-section">
                        {role === 'team' ? (
                            <>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: 600 }}>
                                        Selecione o Mês de Referência:
                                    </label>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <select
                                            value={selectedMonth === null ? -1 : selectedMonth}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setSelectedMonth(val === -1 ? null : val);
                                            }}
                                            style={{
                                                appearance: 'none', padding: '10px 16px 10px 36px', borderRadius: '8px',
                                                border: '1px solid #e5e7eb', background: 'white', color: '#374151',
                                                fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', outline: 'none',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)', minWidth: '200px'
                                            }}
                                        >
                                            <option value={-1}>Detectar Automaticamente</option>
                                            {months.map((m, i) => (
                                                <option key={m} value={i}>{m}</option>
                                            ))}
                                        </select>
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                                            <Calendar size={16} />
                                        </div>
                                    </div>
                                </div>

                                <FileUpload onFileSelect={handleFileSelect} />
                                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '0.9rem' }}>
                                    Importe o CSV de chamados para o time <strong style={{ color: '#1890ff' }}>{currentTeam.name}</strong>.
                                </p>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                <h3>Aguardando dados...</h3>
                                <p>O time <strong>{currentTeam.name}</strong> ainda não importou nenhum dado.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* DASHBOARD CHARTS - CSV */}
                {tickets.length > 0 && (
                    <div className="dashboard-grid">
                        <OriginChart data={originData} />
                        <CategoryChart data={categoryData} />
                        <RequesterChart data={requesterData} />
                        <HistoryChart data={historyData} />
                    </div>
                )}

                {/* DASHBOARD CHARTS - XLSX Chamados */}
                {showChamados && (
                    <>
                        <div style={{
                            marginTop: tickets.length > 0 ? '32px' : '0',
                            marginBottom: '16px',
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <ClipboardList size={20} color="#2563eb" />
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                Painel de Chamados JIRA
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', background: '#f0fdf4', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                                {chamados.length} registros
                            </span>
                        </div>
                        <div className="dashboard-grid">
                            <StatusChart data={statusData} total={chamados.length} />
                            <FuncionalidadeChart data={funcData} />
                        </div>
                    </>
                )}

                {/* Clear data button */}
                {(tickets.length > 0 || chamados.length > 0) && role === 'team' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                            onClick={handleClearData}
                            style={{
                                background: 'transparent', border: 'none', color: '#ef4444',
                                cursor: 'pointer', fontSize: '0.8rem', display: 'flex',
                                alignItems: 'center', gap: '4px', opacity: 0.7
                            }}
                        >
                            <Trash2 size={14} /> Limpar todos os dados de {currentTeam.name}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
