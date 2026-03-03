import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { ArrowLeft, LogOut, LayoutDashboard, Edit2, Star, ClipboardList, Ticket as TicketIcon, Heart, Share2, Calendar, Settings, Building2, FolderKanban, GraduationCap, BarChart2, Loader2, FileDown } from 'lucide-react';
import { exportDashboardToPDF } from '../utils/pdfExport';
import { YearlyLineChart } from '../components/Dashboard/YearlyLineChart';
import InsightsPanel from '../components/Dashboard/InsightsPanel';
import styles from './TeamDashboard.module.css';

export function TeamDashboard() {
    const { teamId } = useParams<{ teamId: string }>();
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine default tab from URL path
    const isIndicadoresPath = location.pathname.includes('/indicadores');
    const [activeTab, setActiveTab] = useState<'geral' | 'indicadores'>(isIndicadoresPath ? 'indicadores' : 'geral');

    // Sync state if URL changes externally
    useEffect(() => {
        setActiveTab(location.pathname.includes('/indicadores') ? 'indicadores' : 'geral');
    }, [location.pathname]);

    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [chamados, setChamados] = useState<Chamado[]>([]);
    const [history, setHistory] = useState<number[]>([]);

    const [isFetchingMonths, setIsFetchingMonths] = useState(true);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const isLoading = isFetchingMonths || isFetchingData;


    // Manual Stats State
    const [manualStats, setManualStats] = useState({ satisfaction: '0', manuals: '0', projetos: '', treinamentos: '' });
    const [isEditingStats, setIsEditingStats] = useState(false);

    // Month Based View State
    // Month Based View State
    const [currentViewMonth, setCurrentViewMonth] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    // Tabs & Indicators State
    const [yearlyIndicators, setYearlyIndicators] = useState<any[]>([]);
    const [indicatorsYear, setIndicatorsYear] = useState<string>(new Date().getFullYear().toString());
    const [isEditingIndicators, setIsEditingIndicators] = useState(false);
    const [indicatorsForm, setIndicatorsForm] = useState(
        Array.from({ length: 12 }, (_, i) => ({
            month: `${indicatorsYear}-${String(i + 1).padStart(2, '0')}`,
            peticionamento: '',
            extrajudiciais: '',
            documentos: '',
            movimentos: '',
        }))
    );

    // Fetch Yearly Indicators
    useEffect(() => {
        if (!currentTeam || activeTab !== 'indicadores') return;

        teamService.getYearlyIndicators(currentTeam.id, indicatorsYear).then((data) => {
            // Map the data into an array of 12 months for the chart & form
            const monthsData = Array.from({ length: 12 }, (_, i) => {
                const monthParam = `${indicatorsYear}-${String(i + 1).padStart(2, '0')}`;
                const existing = data.find((d: any) => d.month === monthParam);
                return {
                    month: monthParam,
                    peticionamento: existing?.peticionamento || '',
                    extrajudiciais: existing?.extrajudiciais || '',
                    documentos: existing?.documentos || '',
                    movimentos: existing?.movimentos || '',
                };
            });
            setYearlyIndicators(monthsData);
            setIndicatorsForm(monthsData);
        }).catch(err => console.error('Failed to load yearly indicators', err));
    }, [currentTeam, activeTab, indicatorsYear]);

    const handleSaveIndicators = async () => {
        if (!currentTeam) return;
        try {
            await teamService.saveYearlyIndicators(currentTeam.id, indicatorsYear, indicatorsForm);
            setIsEditingIndicators(false);
            setYearlyIndicators([...indicatorsForm]);
        } catch (error) {
            console.error('Failed to save indicators', error);
            alert('Erro ao salvar indicadores. Tente novamente.');
        }
    };

    // Load Available Months on Mount
    useEffect(() => {
        if (!currentTeam) return;

        setIsFetchingMonths(true);
        teamService.getDashboard(currentTeam.id).then(data => {
            if (data.availableMonths && data.availableMonths.length > 0) {
                // Select latest month by default if none selected
                if (!currentViewMonth) setCurrentViewMonth(data.availableMonths[0]);
            } else {
                // Se não tiver meses no banco, tenta carregar do localStorage como fallback (migração)
                const localMonths = getAvailableMonths(currentTeam.id);
                if (localMonths.length > 0) {
                    if (!currentViewMonth) setCurrentViewMonth(localMonths[0]);
                } else if (!currentViewMonth) {
                    // Fallback to current month if no data exists
                    setCurrentViewMonth(new Date().toISOString().slice(0, 7));
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
                        manuals: data.manualStats.manuals || '0',
                        projetos: data.manualStats.projetos || '',
                        treinamentos: data.manualStats.treinamentos || ''
                    });
                } else {
                    setManualStats({ satisfaction: '0', manuals: '0', projetos: '', treinamentos: '' });
                }
            }).catch(err => {
                console.error('API getDashboard failed, using localStorage fallback:', err);
                // Fallback: carregar dados do localStorage quando API falha
                const localData = loadMonthData(currentTeam.id, currentViewMonth);
                if (localData) {
                    setTickets(localData.tickets || []);
                    setChamados(localData.chamados || []);
                    if (localData.manualStats) {
                        setManualStats({
                            satisfaction: localData.manualStats.satisfaction || '0',
                            manuals: localData.manualStats.manuals || '0',
                            projetos: (localData.manualStats as any).projetos || '',
                            treinamentos: (localData.manualStats as any).treinamentos || ''
                        });
                    }
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
                if (localData.manualStats) {
                    setManualStats({
                        satisfaction: localData.manualStats.satisfaction || '0',
                        manuals: localData.manualStats.manuals || '0',
                        projetos: (localData.manualStats as any).projetos || '0',
                        treinamentos: (localData.manualStats as any).treinamentos || '0'
                    });
                }
            } else {
                setTickets([]);
                setChamados([]);
                setManualStats({ satisfaction: '0', manuals: '0', projetos: '', treinamentos: '' });
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
                manualStats.manuals,
                manualStats.projetos,
                manualStats.treinamentos
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
                avatarUrl: (user as any).avatarUrl,
            } as any);

            // Busca dados reais do banco para popular coisas fravadas lá (como a avatarUrl atualizada)
            import('../services/teamService').then(({ teamService }) => {
                teamService.getDashboard(resolvedTeamId).then(data => {
                    if (data.team?.avatarUrl) {
                        setCurrentTeam((prev: any) => prev ? { ...prev, avatarUrl: data.team.avatarUrl } : prev);

                        // Atualiza a cache no user (AuthContext/LocalStorage) para os próximos reloads não terem delay:
                        const storedUserRaw = localStorage.getItem('user');
                        if (storedUserRaw) {
                            try {
                                const storedUser = JSON.parse(storedUserRaw);
                                if (storedUser.avatarUrl !== data.team.avatarUrl) {
                                    storedUser.avatarUrl = data.team.avatarUrl;
                                    localStorage.setItem('user', JSON.stringify(storedUser));
                                    // Optionally dispatch event for auth context updates
                                    window.dispatchEvent(new Event('user-updated'));
                                }
                            } catch (e) { }
                        }
                    }
                }).catch(err => console.error(err));
            });
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

    if (!currentTeam) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '16px' }}>
                <Loader2 size={40} color="#0ea5e9" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '1rem' }}>Carregando dados do time...</span>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.layoutContainer}>
                <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className={styles.headerPanel}>
                        <div className={styles.headerLeft}>
                            {role === 'MANAGER' && (
                                <button onClick={handleBack} className={styles.backButton}>
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div className={styles.teamAvatar} style={currentTeam.avatarUrl ? { background: `url(${currentTeam.avatarUrl}) center/cover` } : { background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }}>
                                {!currentTeam.avatarUrl && <LayoutDashboard size={24} />}
                            </div>

                            <div className={styles.teamInfo}>
                                <span className={styles.roleBadge}>
                                    {role === 'MANAGER' ? 'Portal Executivo' : 'Portal Operacional'}
                                </span>
                                <h1 className={styles.teamName}>
                                    {currentTeam.name}
                                </h1>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className={styles.headerActions}>
                            {role === 'TEAM' && (
                                <button
                                    onClick={() => navigate(`/app/team/${currentTeam.id}/import`)}
                                    className={styles.configButton}
                                    title="Configurar Visão Oper."
                                >
                                    <Settings size={18} />
                                    <span className="desktop-only">Configurar Visão Oper.</span>
                                </button>
                            )}

                            <button
                                onClick={async () => {
                                    setIsExporting(true);
                                    setTimeout(async () => {
                                        await exportDashboardToPDF('team-export-area', `Dashboard Operacional - ${currentTeam?.name || 'Equipe'}`);
                                        setIsExporting(false);
                                    }, 100);
                                }}
                                className={styles.configButton}
                                style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}
                                title="Exportar Dashboard para PDF"
                            >
                                {isExporting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <FileDown size={18} />}
                                <span className="desktop-only">Exportar PDF</span>
                            </button>

                            <button onClick={logout} className={styles.backButton} style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }} title="Desconectar">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    {/* FILTER TOOLBAR */}
                    {activeTab === 'geral' && (
                        <div className={styles.filterToolbar}>
                            <div className={styles.monthSelector}>
                                <Calendar size={18} color="#64748b" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Mês Base:</span>

                                <select
                                    className={styles.monthSelect}
                                    value={currentViewMonth ? currentViewMonth.split('-')[1] : '01'}
                                    onChange={(e) => setCurrentViewMonth(`${currentViewMonth ? currentViewMonth.split('-')[0] : new Date().getFullYear()}-${e.target.value}`)}
                                >
                                    <option value="01">Janeiro</option>
                                    <option value="02">Fevereiro</option>
                                    <option value="03">Março</option>
                                    <option value="04">Abril</option>
                                    <option value="05">Maio</option>
                                    <option value="06">Junho</option>
                                    <option value="07">Julho</option>
                                    <option value="08">Agosto</option>
                                    <option value="09">Setembro</option>
                                    <option value="10">Outubro</option>
                                    <option value="11">Novembro</option>
                                    <option value="12">Dezembro</option>
                                </select>

                                <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9rem', padding: '0 4px' }}>/</span>

                                <select
                                    className={styles.monthSelect}
                                    value={currentViewMonth ? currentViewMonth.split('-')[0] : new Date().getFullYear().toString()}
                                    onChange={(e) => setCurrentViewMonth(`${e.target.value}-${currentViewMonth ? currentViewMonth.split('-')[1] : '01'}`)}
                                >
                                    {Array.from({ length: 16 }, (_, i) => 2015 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.filterActions}>
                                <div className={styles.quickFilters}>
                                    <button onClick={setLastWeek} className={styles.quickFilterBtn}>7 dias</button>
                                    <button onClick={setLast15Days} className={styles.quickFilterBtn}>15 dias</button>
                                    <button onClick={setWholeMonth} className={styles.quickFilterBtn}>Mês Cheio</button>
                                </div>

                                <div className={styles.dateRange}>
                                    <div className={styles.dateField}>
                                        <span>DE</span>
                                        <input type="date" className={styles.dateInput} value={formatDateForInput(startDate)} onChange={handleStartDateChange} />
                                    </div>
                                    <div style={{ color: '#cbd5e1' }}>—</div>
                                    <div className={styles.dateField}>
                                        <span>ATÉ</span>
                                        <input type="date" className={styles.dateInput} value={formatDateForInput(endDate)} onChange={handleEndDateChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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

                    .layout-container {
                        padding: 32px 48px;
                        max-width: 1600px;
                        margin: 0 auto;
                    }

                    @media (max-width: 768px) {
                        .desktop-only { display: none; }
                        .layout-container { padding: 16px; }
                    }
                `}</style>
                </header>

                <main id="team-export-area" style={{ marginTop: '0px' }}> {/* Add margin top */}
                    {/* PDF Header - Visible only during export */}
                    {isExporting && (
                        <div className="pdf-page-section" style={{ padding: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '16px', background: 'transparent' }}>
                            <div style={currentTeam.avatarUrl ? { width: '48px', height: '48px', borderRadius: '12px', background: `url(${currentTeam.avatarUrl}) center/cover` } : { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                {!currentTeam.avatarUrl && <LayoutDashboard size={24} />}
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                    {activeTab === 'geral' ? 'Visão Operacional' : 'KPIs e Indicadores'} - {currentTeam.name}
                                </h1>
                                <p style={{ fontSize: '1rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>
                                    Mês de Referência: {currentViewMonth ? currentViewMonth.split('-').reverse().join('/') : ''}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TABS HEADERS */}
                    {!isExporting && (
                        <div className={styles.tabsContainer}>
                            <button
                                onClick={() => { setActiveTab('geral'); navigate(teamId ? `/app/team/${teamId}` : '/app/dashboard'); }}
                                className={`${styles.tabButton} ${activeTab === 'geral' ? styles.active : ''}`}>
                                <LayoutDashboard size={20} />
                                Visão Operacional
                            </button>
                            <button
                                onClick={() => { setActiveTab('indicadores'); navigate(teamId ? `/app/team/${teamId}/indicadores` : '/app/indicadores'); }}
                                className={`${styles.tabButton} ${activeTab === 'indicadores' ? styles.active : ''}`}>
                                <BarChart2 size={20} />
                                KPIs e Indicadores
                            </button>
                            <button
                                onClick={() => navigate(teamId ? `/app/team/${teamId}/institucional` : '/app/institucional')}
                                className={styles.tabButton}>
                                <Building2 size={20} />
                                Dados Institucionais
                            </button>
                        </div>
                    )}

                    {activeTab === 'geral' ? (
                        <>

                            {/* KPI Cards Row */}
                            {!isLoading && (
                                <div className="pdf-page-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>

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

                            {/* AI INSIGHTS PANEL */}
                            {!isExporting && !isLoading && teamId && currentViewMonth && (
                                <InsightsPanel teamId={teamId} month={currentViewMonth} />
                            )}

                            {/* Manual Stats Edit Modal */}
                            {isEditingStats && (
                                <div style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px'
                                }}>
                                    <div style={{
                                        background: '#ffffff', padding: '32px', borderRadius: '20px', border: '1px solid #e2e8f0',
                                        width: '100%', maxWidth: '600px', maxHeight: '90vh',
                                        overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Atualizar Métricas</h3>

                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                                Índice de Satisfação (0-5)
                                            </label>
                                            <input
                                                type="number" step="0.01" max="5" min="0"
                                                value={manualStats.satisfaction}
                                                onChange={(e) => setManualStats({ ...manualStats, satisfaction: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                                Manuais Enviados
                                            </label>
                                            <input
                                                type="number" step="1" min="0"
                                                value={manualStats.manuals}
                                                onChange={(e) => setManualStats({ ...manualStats, manuals: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                                Projetos
                                            </label>
                                            <textarea
                                                rows={5}
                                                placeholder="Liste os projetos..."
                                                value={manualStats.projetos}
                                                onChange={(e) => setManualStats({ ...manualStats, projetos: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '24px' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                                Treinamentos Ministrados
                                            </label>
                                            <textarea
                                                rows={5}
                                                placeholder="Liste os treinamentos..."
                                                value={manualStats.treinamentos}
                                                onChange={(e) => setManualStats({ ...manualStats, treinamentos: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
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
                                                    background: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '12px',
                                                    padding: '10px 24px', fontWeight: 700, cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = '#0ea5e9'; e.currentTarget.style.transform = 'translateY(0)'; }}
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
                                        <div className="pdf-page-section">
                                            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <ClipboardList size={20} color="#0ea5e9" />
                                                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                                    Painel de chamados
                                                </h2>
                                            </div>
                                            <div className="dashboard-grid">
                                                <OriginChart data={originData} />
                                                <CategoryChart data={categoryData} />
                                            </div>
                                        </div>

                                        <div className="pdf-page-section dashboard-grid" style={{ marginTop: '24px' }}>
                                            <RequesterChart data={requesterData} />
                                            <HistoryChart data={historyData} />
                                        </div>
                                    </>
                                )
                            }

                            {/* DASHBOARD CHARTS - XLSX Chamados */}
                            {
                                !isLoading && showChamados && (
                                    <div className="pdf-page-section">
                                        <div style={{
                                            marginTop: tickets.length > 0 ? '32px' : '0',
                                            marginBottom: '16px',
                                            display: 'flex', alignItems: 'center', gap: '10px'
                                        }}>
                                            <ClipboardList size={20} color="#0ea5e9" />
                                            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                                Painel de Chamados JIRA
                                            </h2>
                                            <span style={{ fontSize: '0.8rem', color: '#0284c7', background: '#f0f9ff', padding: '2px 10px', borderRadius: '100px', fontWeight: 600, border: '1px solid #bae6fd' }}>
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
                                    </div>
                                )
                            }

                            {/* NEW PANEL - PROJETOS & TREINAMENTOS */}
                            {
                                !isLoading && (
                                    <div className="pdf-page-section">
                                        <div style={{
                                            marginTop: '32px',
                                            marginBottom: '16px',
                                            display: 'flex', alignItems: 'center', gap: '10px'
                                        }}>
                                            <ClipboardList size={20} color="#0ea5e9" />
                                            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                                Entregas do Período
                                            </h2>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                            {/* Card: Projetos (Teal) */}
                                            <div style={{
                                                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                                borderRadius: '16px', padding: '24px', color: 'white',
                                                boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)',
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
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9, margin: 0, color: 'white' }}>Projetos no Mês</h3>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                                        <FolderKanban size={24} color="white" />
                                                    </div>
                                                </div>
                                                <div style={{
                                                    flex: 1,
                                                    fontSize: '0.95rem',
                                                    fontWeight: 500,
                                                    lineHeight: 1.5,
                                                    whiteSpace: 'pre-wrap',
                                                    maxHeight: 'none',
                                                    overflowY: 'visible'
                                                }}>
                                                    {manualStats.projetos || 'Nenhum projeto informado.'}
                                                </div>
                                            </div>

                                            {/* Card: Treinamentos (Indigo) */}
                                            <div style={{
                                                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                                                borderRadius: '16px', padding: '24px', color: 'white',
                                                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
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
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9, margin: 0, color: 'white' }}>Treinamentos Ministrados</h3>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                                        <GraduationCap size={24} color="white" />
                                                    </div>
                                                </div>
                                                <div style={{
                                                    flex: 1,
                                                    fontSize: '0.95rem',
                                                    fontWeight: 500,
                                                    lineHeight: 1.5,
                                                    whiteSpace: 'pre-wrap',
                                                    maxHeight: 'none',
                                                    overflowY: 'visible'
                                                }}>
                                                    {manualStats.treinamentos || 'Nenhum treinamento informado.'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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


                        </>
                    ) : (
                        <>
                            {/* INDICADORES VIEW */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#ffffff', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                                        <BarChart2 size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Indicadores Anuais</h2>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Métricas preenchidas mês a mês por relatório</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <Calendar size={18} color="#64748b" />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Ano:</span>
                                        <select
                                            value={indicatorsYear}
                                            onChange={(e) => setIndicatorsYear(e.target.value)}
                                            style={{ border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a', cursor: 'pointer', outline: 'none', fontSize: '1rem' }}
                                        >
                                            {Array.from({ length: 16 }, (_, i) => 2015 + i).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {role === 'TEAM' && (
                                        <button
                                            onClick={() => setIsEditingIndicators(true)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0ea5e9', color: '#ffffff', padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseOver={(e) => { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = '#0ea5e9'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            Preencher Mês
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
                                <YearlyLineChart
                                    data={yearlyIndicators.map(indicator => ({
                                        name: indicator.month.split('-')[1],
                                        value: Number(indicator.peticionamento) || 0
                                    }))}
                                    title="Evolução de Peticionamento"
                                    color="#5865F2"
                                />
                                <YearlyLineChart
                                    data={yearlyIndicators.map(indicator => ({
                                        name: indicator.month.split('-')[1],
                                        value: Number(indicator.extrajudiciais) || 0
                                    }))}
                                    title="Novos Extrajudiciais"
                                    color="#5865F2"
                                />
                                <YearlyLineChart
                                    data={yearlyIndicators.map(indicator => ({
                                        name: indicator.month.split('-')[1],
                                        value: Number(indicator.documentos) || 0
                                    }))}
                                    title="Documentos Emitidos"
                                    color="#5865F2"
                                />
                                <YearlyLineChart
                                    data={yearlyIndicators.map(indicator => ({
                                        name: indicator.month.split('-')[1],
                                        value: Number(indicator.movimentos) || 0
                                    }))}
                                    title="Movimentos Taxonômicos"
                                    color="#5865F2"
                                />
                            </div>

                            {isEditingIndicators && (
                                <div style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px'
                                }}>
                                    <div style={{
                                        background: 'white', padding: '32px', borderRadius: '24px',
                                        width: '100%', maxWidth: '800px', maxHeight: '90vh',
                                        overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                    }}>
                                        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                                            Atualizar Indicadores ({indicatorsYear})
                                        </h3>

                                        <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>Mês</th>
                                                        <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>Peticionamento</th>
                                                        <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>Novos Extrajudiciais</th>
                                                        <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>Documentos Emitidos</th>
                                                        <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>Movimentos Tax.</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {indicatorsForm.map((item, index) => {
                                                        const mesLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                                                        return (
                                                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '12px', fontWeight: 600, color: '#334155' }}>
                                                                    {mesLabels[index]}
                                                                </td>
                                                                <td style={{ padding: '8px' }}>
                                                                    <input type="number" value={item.peticionamento} onChange={e => {
                                                                        const newForm = [...indicatorsForm];
                                                                        newForm[index].peticionamento = e.target.value;
                                                                        setIndicatorsForm(newForm);
                                                                    }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                                                </td>
                                                                <td style={{ padding: '8px' }}>
                                                                    <input type="number" value={item.extrajudiciais} onChange={e => {
                                                                        const newForm = [...indicatorsForm];
                                                                        newForm[index].extrajudiciais = e.target.value;
                                                                        setIndicatorsForm(newForm);
                                                                    }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                                                </td>
                                                                <td style={{ padding: '8px' }}>
                                                                    <input type="number" value={item.documentos} onChange={e => {
                                                                        const newForm = [...indicatorsForm];
                                                                        newForm[index].documentos = e.target.value;
                                                                        setIndicatorsForm(newForm);
                                                                    }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                                                </td>
                                                                <td style={{ padding: '8px' }}>
                                                                    <input type="number" value={item.movimentos} onChange={e => {
                                                                        const newForm = [...indicatorsForm];
                                                                        newForm[index].movimentos = e.target.value;
                                                                        setIndicatorsForm(newForm);
                                                                    }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => setIsEditingIndicators(false)}
                                                style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: '8px 16px' }}>
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveIndicators}
                                                style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 24px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                Salvar Indicadores
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
