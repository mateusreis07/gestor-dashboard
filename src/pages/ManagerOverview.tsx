import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadTeams, loadTeamTickets } from '../utils/storage';
import type { Team } from '../utils/types';
import { LogOut, Settings, Users, BarChart3, ChevronRight, Plus } from 'lucide-react';
import styles from './ManagerOverview.module.css';

interface TeamWithStats extends Team {
    ticketCount: number;
}

export function ManagerOverview() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<TeamWithStats[]>([]);

    useEffect(() => {
        const rawTeams = loadTeams();
        const teamsWithStats: TeamWithStats[] = rawTeams.map(team => {
            const tickets = loadTeamTickets(team.id);
            return { ...team, ticketCount: tickets.length };
        });
        setTeams(teamsWithStats);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/welcome');
    };

    const getTeamColor = (name: string) => {
        const hue = (name.length * 47 + name.charCodeAt(0) * 13) % 360;
        return {
            bg: `hsl(${hue}, 75%, 94%)`,
            text: `hsl(${hue}, 75%, 30%)`,
            accent: `hsl(${hue}, 75%, 50%)`,
            gradient: `linear-gradient(135deg, hsl(${hue}, 80%, 55%) 0%, hsl(${hue + 30}, 75%, 45%) 100%)`
        };
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerLogo}>
                        <BarChart3 color="white" size={22} />
                    </div>
                    <div>
                        <h1 className={styles.headerTitle}>Gestor Dashboard</h1>
                        {user && (
                            <p className={styles.headerGreeting}>
                                Olá, <strong>{user.name}</strong>
                            </p>
                        )}
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button
                        onClick={() => navigate('/app/manager')}
                        className={styles.manageButton}
                    >
                        <Settings size={16} />
                        <span>Gerenciar Times</span>
                    </button>
                    <button onClick={handleLogout} className={styles.logoutButton} title="Sair">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Painel de Equipes</h2>
                        <p className={styles.sectionSubtitle}>
                            Selecione uma equipe para visualizar seu dashboard de chamados
                        </p>
                    </div>
                    <div className={styles.teamCount}>
                        <Users size={16} />
                        <span>{teams.length} {teams.length === 1 ? 'equipe' : 'equipes'}</span>
                    </div>
                </div>

                {teams.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Users size={48} strokeWidth={1.2} />
                        </div>
                        <h3 className={styles.emptyTitle}>Nenhuma equipe cadastrada</h3>
                        <p className={styles.emptyText}>
                            Crie sua primeira equipe para começar a visualizar os dashboards.
                        </p>
                        <button
                            onClick={() => navigate('/app/manager')}
                            className={styles.emptyButton}
                        >
                            <Plus size={18} />
                            Criar Primeira Equipe
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
                                            style={{ background: colors.gradient }}
                                        >
                                            {team.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <ChevronRight size={20} className={styles.cardArrow} />
                                    </div>

                                    <div className={styles.cardBody}>
                                        <h3 className={styles.cardName}>{team.name}</h3>
                                        <p className={styles.cardEmail}>{team.email || 'Sem e-mail'}</p>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.cardStat}>
                                            <BarChart3 size={14} />
                                            <span>
                                                {team.ticketCount > 0
                                                    ? `${team.ticketCount} chamados`
                                                    : 'Sem dados ainda'}
                                            </span>
                                        </div>
                                        <div
                                            className={styles.cardIndicator}
                                            style={{ background: team.ticketCount > 0 ? '#22c55e' : '#d1d5db' }}
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
