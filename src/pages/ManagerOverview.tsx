import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadTeams, loadTeamTickets, loadTeamChamados } from '../utils/storage';
import { managerTeamsService } from '../services/teamService';
import type { Team } from '../utils/types';
import { LogOut, Settings, Users, BarChart3, ChevronRight, Plus, Database } from 'lucide-react';
import styles from './ManagerOverview.module.css';

interface TeamWithStats extends Team {
    ticketCount: number;
}

export function ManagerOverview() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<TeamWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
                // Tenta puxar do banco real
                const apiTeams = await managerTeamsService.listTeams();

                const teamsWithStats: TeamWithStats[] = apiTeams.map(team => {
                    const tickets = loadTeamTickets(team.id);
                    const chamadosData = loadTeamChamados(team.id);
                    const chamadosCount = chamadosData?.chamados?.length || 0;

                    return {
                        ...team,
                        createdAt: typeof team.createdAt === 'string' ? new Date(team.createdAt).getTime() : team.createdAt,
                        ticketCount: team.ticketCount !== undefined ? team.ticketCount : (tickets.length + chamadosCount)
                    } as TeamWithStats;
                });
                setTeams(teamsWithStats);
            } catch (error) {
                console.error('Failed to load teams from API, falling back to localStorage:', error);
                // Fallback de segurança para modo offline
                const rawTeams = loadTeams();
                const teamsWithStats: TeamWithStats[] = rawTeams.map(team => {
                    const tickets = loadTeamTickets(team.id);
                    const chamadosData = loadTeamChamados(team.id);
                    const chamadosCount = chamadosData?.chamados?.length || 0;
                    return { ...team, ticketCount: tickets.length + chamadosCount };
                });
                setTeams(teamsWithStats);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/welcome');
    };

    const getTeamColor = (name: string) => {
        const hue = (name.length * 47 + name.charCodeAt(0) * 13) % 360;
        return {
            gradient: `linear-gradient(135deg, hsl(${hue}, 80%, 45%) 0%, hsl(${hue + 30}, 75%, 25%) 100%)`
        };
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerLogo}>
                        <BarChart3 color="#ffffff" size={24} />
                    </div>
                    <div>
                        <h1 className={styles.headerTitle}>GestorOS</h1>
                        {user && (
                            <p className={styles.headerGreeting}>
                                Board Executivo • <strong>{user.name}</strong>
                            </p>
                        )}
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button
                        onClick={() => navigate('/app/import-schema')}
                        className={styles.manageButton}
                    >
                        <Database size={16} />
                        <span>Esquema de Dados</span>
                    </button>
                    <button
                        onClick={() => navigate('/app/manager')}
                        className={styles.manageButton}
                    >
                        <Settings size={16} />
                        <span>Gerenciar Operações</span>
                    </button>
                    <button onClick={handleLogout} className={styles.logoutButton} title="Desconectar">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionHeaderTop}>
                        <h2 className={styles.sectionTitle}>Times Operacionais</h2>
                        <div className={styles.teamCount}>
                            <Users size={16} />
                            <span>{teams.length} {teams.length === 1 ? 'equipe' : 'equipes'}</span>
                        </div>
                    </div>
                    <p className={styles.sectionSubtitle}>
                        Acesse as unidades abaixo para monitorar chamados estratégicos e performance setorial.
                    </p>
                </div>

                {isLoading ? (
                    <div className={styles.loadingGrid}>
                        <div className={styles.loadingSkeleton}></div>
                        <div className={styles.loadingSkeleton}></div>
                        <div className={styles.loadingSkeleton}></div>
                    </div>
                ) : teams.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Users size={48} strokeWidth={1} />
                        </div>
                        <h3 className={styles.emptyTitle}>Nenhuma operação mapeada</h3>
                        <p className={styles.emptyText}>
                            Sua infraestrutura está limpa. Crie sua primeira unidade de time no painel operacional para começar o tracking.
                        </p>
                        <button
                            onClick={() => navigate('/app/manager')}
                            className={styles.emptyButton}
                        >
                            <Plus size={18} />
                            Criar Nova Equipe
                        </button>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {teams.map((team) => {
                            const colors = getTeamColor(team.name);
                            return (
                                <button
                                    key={team.id}
                                    className={styles.card}
                                    onClick={() => navigate(`/app/team/${team.id}`)}
                                >
                                    <div className={styles.cardTop}>
                                        <div
                                            className={styles.cardAvatar}
                                            style={team.avatarUrl ? { background: `url(${team.avatarUrl}) center/cover` } : { background: colors.gradient }}
                                        >
                                            {!team.avatarUrl && team.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <ChevronRight size={20} className={styles.cardArrow} />
                                    </div>

                                    <div className={styles.cardBody}>
                                        <h3 className={styles.cardName}>{team.name}</h3>
                                        <p className={styles.cardEmail}>{team.email || 'Credencial Pendente'}</p>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.cardStat}>
                                            <BarChart3 size={14} />
                                            <span>
                                                {team.ticketCount > 0
                                                    ? `${team.ticketCount} tickets mapeados`
                                                    : 'Aguardando logs'}
                                            </span>
                                        </div>
                                        <div
                                            className={styles.cardIndicator}
                                            style={{
                                                color: team.ticketCount > 0 ? '#22c55e' : '#cbd5e1',
                                                background: 'currentColor'
                                            }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
