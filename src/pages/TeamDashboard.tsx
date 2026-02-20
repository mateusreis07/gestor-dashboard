import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OriginChart } from '../components/Dashboard/OriginChart';
import { CategoryChart } from '../components/Dashboard/CategoryChart';
import { RequesterChart } from '../components/Dashboard/RequesterChart';
import { HistoryChart } from '../components/Dashboard/HistoryChart';
import { StatusChart } from '../components/Dashboard/StatusChart';
import { FuncionalidadeChart } from '../components/Dashboard/FuncionalidadeChart';
import { StatusDetailsModal } from '../components/Dashboard/StatusDetailsModal';
import {
    getOriginStats,
    getCategoryStats,
    getRequesterStats,
    getHistoryStats,
    filterTicketsByDateRange,
    parseTicketDate
} from '../utils/csvParser';
import { getStatusStats, getFuncionalidadeStats, filterChamadosByDateRange } from '../utils/xlsxParser';
import { getAvailableMonths, loadMonthData, loadTeams } from '../utils/storage';
import { teamService } from '../services/teamService';
import type { Ticket, Team, Chamado } from '../utils/types';
import { ArrowLeft, LogOut, LayoutDashboard, Edit2, Star, ClipboardList, Ticket as TicketIcon, Heart, Share2, Calendar, Settings } from 'lucide-react';

export function TeamDashboard() {
    const { teamId } = useParams<{ teamId: string }>();
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();

    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [chamados, setChamados] = useState<Chamado[]>([]);
    const [history, setHistory] = useState<number[]>([]);

    const [isFetchingMonths, setIsFetchingMonths] = useState(true);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const isLoading = isFetchingMonths || isFetchingData;


    // Manual Stats State
    const [manualStats, setManualStats] = useState({ satisfaction: '0', manuals: '0' });
    const [isEditingStats, setIsEditingStats] = useState(false);

    // Month Based View State
    const [currentViewMonth, setCurrentViewMonth] = useState<string>('');
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);

    // Load Available Months on Mount
    useEffect(() => {
        if (!currentTeam) return;

        setIsFetchingMonths(true);
        teamService.getDashboard(currentTeam.id).then(data => {
            if (data.availableMonths && data.availableMonths.length > 0) {
                setAvailableMonths(data.availableMonths);
                // Select latest month by default if none selected
                if (!currentViewMonth) setCurrentViewMonth(data.availableMonths[0]);
            } else {
                // Se não tiver meses no banco, tenta carregar do localStorage como fallback (migração)
                const localMonths = getAvailableMonths(currentTeam.id);
                if (localMonths.length > 0) {
                    setAvailableMonths(localMonths);
                    if (!currentViewMonth) setCurrentViewMonth(localMonths[0]);
                }
            }
        }).catch(err => {
            console.error('Failed to load initial dashboard data', err);
        }).finally(() => {
            setIsFetchingMonths(false);
        });
    }, [currentTeam]);

    // Load Data when Month/Team Changes
    useEffect(() => {
        if (!currentTeam) return;

        setIsFetchingData(true);

        // Se tiver mês selecionado, busca filtrado da API
        if (currentViewMonth) {
            teamService.getDashboard(currentTeam.id, currentViewMonth).then(data => {
                setTickets(data.tickets || []);
                setChamados(data.chamados || []);
                if (data.history) setHistory(data.history);

                if (data.manualStats) {
                    setManualStats({
                        satisfaction: data.manualStats.satisfaction || '0',
                        manuals: data.manualStats.manuals || '0'
                    });
                } else {
                    setManualStats({ satisfaction: '0', manuals: '0' });
                }
            }).catch(err => {
                console.error('API getDashboard failed, using localStorage fallback:', err);
                // Fallback: carregar dados do localStorage quando API falha
                const localData = loadMonthData(currentTeam.id, currentViewMonth);
                if (localData) {
                    setTickets(localData.tickets || []);
                    setChamados(localData.chamados || []);
                    if (localData.manualStats) setManualStats(localData.manualStats);
                }
            }).finally(() => {
                setIsFetchingData(false);
            });
        } else {
            // Se não tiver mês (ex: time novo sem dados), ou fallback local
            // Tenta carregar localmente caso a API falhe ou esteja vazia (legacy mode)
            const localData = loadMonthData(currentTeam.id, currentViewMonth);
            if (localData) {
                setTickets(localData.tickets || []);
                setChamados(localData.chamados || []);
                if (localData.manualStats) setManualStats(localData.manualStats);
            } else {
                setTickets([]);
                setChamados([]);
                setManualStats({ satisfaction: '0', manuals: '0' });
            }
            setIsFetchingData(false);
        }
    }, [currentViewMonth, currentTeam]);

    // Save Manual Stats to API
    const handleSaveStats = async () => {
        if (!currentTeam || !currentViewMonth) return;

        try {
            await teamService.saveManualStats(
                currentTeam.id,
                currentViewMonth,
                manualStats.satisfaction,
                manualStats.manuals
            );
            setIsEditingStats(false);
            // Dados salvos no banco com sucesso. O estado local manualStats já reflete a edição.
        } catch (error) {
            console.error('Failed to save stats', error);
            alert('Erro ao salvar estatísticas. Tente novamente.');
        }
    };

    // New Date Range State
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    // Load team data on mount or teamId change
    useEffect(() => {
        // Prioridade: teamId da URL, depois o ID do usuário logado (time)
        const resolvedTeamId = teamId || (role === 'TEAM' && user ? user.id : null);

        if (!resolvedTeamId) {
            if (role === 'MANAGER') {
                navigate('/app/overview');
            } else {
                navigate('/welcome');
            }
            return;
        }

        // Para o usuário TEAM logado, o "time" é ele mesmo
        if (user && (role === 'TEAM' || resolvedTeamId === user.id)) {
            setCurrentTeam({
                id: user.id,
                name: user.name || user.email,
                email: user.email,
                password: '',
            } as any);
            return;
        }

        // Para o gestor visualizando um time específico, busca via API com Fallback Local
        import('../services/teamService').then(({ managerTeamsService }) => {
            managerTeamsService.listTeams().then(teams => {
                const team = teams.find(t => t.id === resolvedTeamId);
                if (team) {
                    setCurrentTeam({ ...team, password: '' } as any);
                } else {
                    // Tentar Local Storage se não achar na API (pode ser delay de sync)
                    const localTeams = loadTeams();
                    const local = localTeams.find(t => t.id === resolvedTeamId);
                    if (local) {
                        setCurrentTeam({ ...local, password: '' } as any);
                    } else {
                        console.warn('Team not found in API or LocalStorage');
                        navigate('/app/manager');
                    }
                }
            }).catch((err) => {
                console.error('API Error, trying local storage', err);
                const localTeams = loadTeams();
                const local = localTeams.find(t => t.id === resolvedTeamId);
                if (local) {
                    setCurrentTeam({ ...local, password: '' } as any);
                } else {
                    navigate('/app/manager');
                }
            });
        });
    }, [teamId, navigate, role, user]);


    // --- Data Processing ---
    const filteredTickets = useMemo(() => {
        return filterTicketsByDateRange(tickets, startDate, endDate);
    }, [tickets, startDate, endDate]);

    const originData = useMemo(() => getOriginStats(filteredTickets), [filteredTickets]);
    const categoryData = useMemo(() => getCategoryStats(filteredTickets), [filteredTickets]);
    const requesterData = useMemo(() => getRequesterStats(filteredTickets), [filteredTickets]);

    const historyData = useMemo(() => {
        if (history && history.length > 0 && history.some(v => v > 0)) {
            const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            const fullMonthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            return history.map((count, index) => ({
                name: monthNames[index],
                value: count,
                fullLabel: fullMonthNames[index],
                order: index
            }));
        }
        return getHistoryStats(tickets);
    }, [history, tickets]);

    // --- Chamados XLSX Data ---
    const showChamados = chamados.length > 0;
    const filteredChamados = useMemo(() => {
        return filterChamadosByDateRange(chamados, startDate, endDate);
    }, [chamados, startDate, endDate]);

    const statusData = useMemo(() => getStatusStats(filteredChamados), [filteredChamados]);
    const funcData = useMemo(() => getFuncionalidadeStats(filteredChamados), [filteredChamados]);

    // --- Handlers ---

    const handleBack = () => {
        if (role === 'MANAGER') {
            navigate('/app/overview');
        } else {
            logout();
            navigate('/welcome');
        }
    };

    const handleStatusClick = (status: string) => {
        setSelectedStatus(status);
    };

    // Find the latest date in the dataset to use as anchor for "Latest" filters
    const lastDataDate = useMemo(() => {
        if (tickets.length === 0 && chamados.length === 0) return new Date();
        let max = 0;

        tickets.forEach(t => {
            const dateStr = t["Data de abertura"] || (t as any).dataAbertura;
            const d = parseTicketDate(dateStr);
            if (d && d.getTime() > max) max = d.getTime();
        });

        chamados.forEach(c => {
            const d = parseTicketDate(c.criado);
            if (d && d.getTime() > max) max = d.getTime();
        });

        return max > 0 ? new Date(max) : new Date();
    }, [tickets, chamados]);

    const setLastWeek = () => {
        const end = new Date(lastDataDate);
        const start = new Date(lastDataDate);
        start.setDate(end.getDate() - 6); // Last 7 days including today
        setStartDate(start);
        setEndDate(end);
    };

    const setLast15Days = () => {
        const end = new Date(lastDataDate);
        const start = new Date(lastDataDate);
        start.setDate(end.getDate() - 14);
        setStartDate(start);
        setEndDate(end);
    };

    const setWholeMonth = () => {
        const target = new Date(lastDataDate);
        const start = new Date(target.getFullYear(), target.getMonth(), 1);
        const end = new Date(target.getFullYear(), target.getMonth() + 1, 0);
        setStartDate(start);
        setEndDate(end);
    };

    // Formatting date for input value (YYYY-MM-DD)
    const formatDateForInput = (date: Date | null) => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const [y, m, d] = e.target.value.split('-').map(Number);
            setStartDate(new Date(y, m - 1, d));
        } else {
            setStartDate(null);
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const [y, m, d] = e.target.value.split('-').map(Number);
            setEndDate(new Date(y, m - 1, d));
        } else {
            setEndDate(null);
        }
    };

    if (!currentTeam) return <div>Carregando...</div>;

    return (
        <div className="layout-container" style={{ gap: '12px' }}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* TOP HEADER: Identity & Actions */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'white', padding: '16px 24px', borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    {/* Left: Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {role === 'MANAGER' && (
                            <button onClick={handleBack} className="icon-btn-ghost">
                                <ArrowLeft size={20} color="#6b7280" />
                            </button>
                        )}
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                        }}>
                            <LayoutDashboard size={24} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
                                    color: '#64748b', textTransform: 'uppercase',
                                    background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px'
                                }}>
                                    {role === 'MANAGER' ? 'Portal do Gestor' : 'Portal do Time'}
                                </span>
                            </div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0', lineHeight: 1.2 }}>
                                {currentTeam.name}
                            </h1>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    {/* Right: Actions */}
                    {role === 'TEAM' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => navigate(`/app/team/${currentTeam.id}/import`)}
                                className="btn-secondary"
                                title="Configurar Importação"
                            >
                                <Settings size={18} />
                                <span className="desktop-only">Configurar</span>
                            </button>
                            <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
                            <button onClick={logout} className="btn-icon-secondary" title="Sair">
                                <LogOut size={18} color="#ef4444" />
                            </button>
                        </div>
                    )}
                </div>

                {/* FILTER TOOLBAR */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 8px'
                }}>

                    {/* Left: Summary Stats - REMOVED per user request */}
                    <div>
                        {availableMonths.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                <Calendar size={16} color="#64748b" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Mês:</span>
                                <select
                                    value={currentViewMonth}
                                    onChange={(e) => setCurrentViewMonth(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                                >
                                    {availableMonths.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Right: Filters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                        {/* Quick Actions */}
                        <div style={{ display: 'flex', background: 'white', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <button onClick={setLastWeek} className="segment-btn">7 dias</button>
                            <button onClick={setLast15Days} className="segment-btn">15 dias</button>
                            <button onClick={setWholeMonth} className="segment-btn">Mês</button>
                        </div>

                        {/* Date Inputs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div className="date-field">
                                <span className="label">DE</span>
                                <input type="date" value={formatDateForInput(startDate)} onChange={handleStartDateChange} />
                            </div>
                            <div style={{ color: '#cbd5e1' }}>—</div>
                            <div className="date-field">
                                <span className="label">ATÉ</span>
                                <input type="date" value={formatDateForInput(endDate)} onChange={handleEndDateChange} />
                            </div>
                        </div>

                    </div>
                </div>

                <style>{`
                    .icon-btn-ghost { background: transparent; border: none; padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justifyContent: center; }
                    .icon-btn-ghost:hover { background: #f1f5f9; }

                    .btn-secondary { background: white; border: 1px solid #e2e8f0; color: #475569; padding: 8px 16px; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; display: flex; alignItems: center; gap: 8px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                    .btn-secondary:hover { border-color: #cbd5e1; background: #f8fafc; color: #1e293b; transform: translateY(-1px); }

                    .btn-icon-secondary { background: white; border: 1px solid #e2e8f0; padding: 8px; border-radius: 10px; cursor: pointer; display: flex; alignItems: center; justify-content: center; transition: all 0.2s; }
                    .btn-icon-secondary:hover { border-color: #fca5a5; background: #fef2f2; }

                    .segment-btn { background: transparent; border: none; padding: 6px 12px; font-size: 0.8rem; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
                    .segment-btn:hover { background: #f1f5f9; color: #0f172a; }
                    .segment-btn:active { background: #e2e8f0; }

                    .date-field { display: flex; alignItems: center; gap: 6px; }
                    .date-field .label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; }
                    .date-field input { border: none; outline: none; font-size: 0.85rem; color: #334155; font-weight: 500; font-family: inherit; width: 110px; }
                    .date-field input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
                    .date-field input::-webkit-calendar-picker-indicator:hover { opacity: 1; }

                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: .5; }
                    }
                    .skeleton-box {
                        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                        background: #e2e8f0;
                    }

                    @media (max-width: 768px) {
                        .desktop-only { display: none; }
                        .layout-container { padding: 16px; }
                    }
                `}</style>
            </header>

            <main className="dashboard-content" style={{ marginTop: '0px' }}> {/* Add margin top */}

                {/* KPI Cards Row */}
                {!isLoading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>

                        {/* Card 1: Total Tickets (Violet) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            borderRadius: '16px', padding: '24px', color: 'white',
                            boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.2)',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, margin: 0 }}>Chamados no Período</h3>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '8px 0 0 0', lineHeight: 1 }}>
                                        {filteredTickets.length}
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                    <TicketIcon size={24} color="white" />
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '12px' }}>
                                Status: Filtrado por data
                            </div>
                        </div>

                        {/* Card 2: Satisfaction (Pink) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                            borderRadius: '16px', padding: '24px', color: 'white',
                            boxShadow: '0 4px 6px -1px rgba(219, 39, 119, 0.2)',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px',
                            position: 'relative'
                        }}>
                            {role === 'TEAM' && (
                                <button
                                    onClick={() => setIsEditingStats(true)}
                                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'white' }}
                                    title="Editar dados manuais"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, margin: 0 }}>Índice de Satisfação</h3>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Global Bot – WhatsApp</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                    <Heart size={24} color="white" fill="rgba(255,255,255,0.2)" />
                                </div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={24}
                                            fill={star <= Math.round(Number(manualStats.satisfaction)) ? "white" : "none"}
                                            color={star <= Math.round(Number(manualStats.satisfaction)) ? "white" : "rgba(255,255,255,0.4)"}
                                        />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                                        {manualStats.satisfaction}
                                    </span>
                                    <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.8 }}>/ 5.0</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Manuals Sent (Orange) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
                            borderRadius: '16px', padding: '24px', color: 'white',
                            boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px',
                            position: 'relative'
                        }}>
                            {role === 'TEAM' && (
                                <button
                                    onClick={() => setIsEditingStats(true)}
                                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'white' }}
                                    title="Editar dados manuais"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, margin: 0 }}>Manuais Enviados</h3>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '8px 0 0 0', lineHeight: 1 }}>
                                        {manualStats.manuals}
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                    <Share2 size={24} color="white" />
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '12px' }}>
                                SAJ Ajuda
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Stats Edit Modal */}
                {isEditingStats && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '320px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#0f172a' }}>Atualizar Métricas</h3>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                                    Índice de Satisfação (0-5)
                                </label>
                                <input
                                    type="number" step="0.01" max="5" min="0"
                                    value={manualStats.satisfaction}
                                    onChange={(e) => setManualStats({ ...manualStats, satisfaction: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                                    Manuais Enviados
                                </label>
                                <input
                                    type="number" step="1" min="0"
                                    value={manualStats.manuals}
                                    onChange={(e) => setManualStats({ ...manualStats, manuals: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setIsEditingStats(false)}
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: '8px 16px' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveStats}
                                    style={{
                                        background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
                                        padding: '8px 24px', fontWeight: 600, cursor: 'pointer',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* SKELETON LOADER */}
                {
                    isLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                                <div className="skeleton-box" style={{ height: '140px', borderRadius: '16px' }}></div>
                                <div className="skeleton-box" style={{ height: '140px', borderRadius: '16px' }}></div>
                                <div className="skeleton-box" style={{ height: '140px', borderRadius: '16px' }}></div>
                            </div>
                            <div className="dashboard-grid">
                                <div className="skeleton-box" style={{ height: '350px', borderRadius: '16px' }}></div>
                                <div className="skeleton-box" style={{ height: '350px', borderRadius: '16px' }}></div>
                            </div>
                        </div>
                    )
                }

                {/* EMPTY STATE */}
                {
                    !isLoading && tickets.length === 0 && chamados.length === 0 && (
                        <div className="upload-section">
                            {role === 'TEAM' ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    <h3>Nenhum dado importado ainda.</h3>
                                    <p>Comece importando um arquivo CSV ou XLSX para visualizar os dados do time <strong style={{ color: '#1890ff' }}>{currentTeam.name}</strong>.</p>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    <h3>Aguardando dados...</h3>
                                    <p>O time <strong>{currentTeam.name}</strong> ainda não importou nenhum dado.</p>
                                </div>
                            )}
                        </div>
                    )
                }



                {/* DASHBOARD CHARTS - CSV */}
                {
                    !isLoading && tickets.length > 0 && (
                        <>
                            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ClipboardList size={20} color="#2563eb" />
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                    Painel de chamados
                                </h2>
                            </div>
                            <div className="dashboard-grid">
                                <OriginChart data={originData} />
                                <CategoryChart data={categoryData} />
                            </div>

                            <div className="dashboard-grid">
                                <RequesterChart data={requesterData} />
                                <HistoryChart data={historyData} />
                            </div>
                        </>
                    )
                }

                {/* DASHBOARD CHARTS - XLSX Chamados */}
                {
                    !isLoading && showChamados && (
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
                                <StatusChart
                                    data={statusData}
                                    total={chamados.length}
                                    onSliceClick={handleStatusClick}
                                />
                                <FuncionalidadeChart data={funcData} />
                            </div>
                        </>
                    )
                }

                {/* Status Details Modal */}
                {
                    selectedStatus && (
                        <StatusDetailsModal
                            status={selectedStatus}
                            chamados={chamados}
                            onClose={() => setSelectedStatus(null)}
                        />
                    )
                }


            </main >
        </div >
    );
}
