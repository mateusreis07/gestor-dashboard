import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TeamManager } from '../components/Team/TeamManager';
import { loadTeams, addTeam, deleteTeam, updateTeam, clearTeamTickets } from '../utils/storage';
import type { Team } from '../utils/types';
import { ArrowLeft, Settings } from 'lucide-react';

export function ManagerHub() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        setTeams(loadTeams());
    }, []);

    const handleAddTeam = (name: string, email: string, password?: string) => {
        const emailExists = teams.some(t => t.email === email);
        if (emailExists) {
            alert('Este e-mail já está em uso por outro time.');
            return;
        }
        addTeam(name, email, password);
        setTeams(loadTeams());
    };

    const handleDeleteTeam = (teamId: string) => {
        if (!confirm('Tem certeza que deseja deletar este time?')) return;
        deleteTeam(teamId);
        clearTeamTickets(teamId);
        setTeams(loadTeams());
    };

    const handleSelectTeam = (team: Team) => {
        navigate(`/app/team/${team.id}`);
    };

    const handleEditTeam = (teamId: string, data: { name?: string; email?: string; password?: string }) => {
        // Check if new email conflicts with another team
        if (data.email) {
            const emailExists = teams.some(t => t.id !== teamId && t.email === data.email);
            if (emailExists) {
                alert('Este e-mail já está em uso por outro time.');
                return;
            }
        }
        updateTeam(teamId, data);
        setTeams(loadTeams());
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 50%, #f0f9ff 100%)' }}>
            {/* Header */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 32px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        onClick={() => navigate('/app/overview')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '40px', height: '40px', borderRadius: '10px',
                            border: '1px solid #c4c9d1', background: '#e8eaed',
                            cursor: 'pointer', transition: 'all 0.2s ease'
                        }}
                        title="Voltar ao Painel"
                    >
                        <ArrowLeft size={18} color="#1f2937" />
                    </button>

                    <div style={{
                        background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                        padding: '10px', borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Settings color="white" size={22} />
                    </div>

                    <div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937', margin: 0, lineHeight: 1.2 }}>
                            Gerenciar Times
                        </h1>
                        {user && (
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '2px 0 0 0' }}>
                                Criar, editar e remover equipes
                            </p>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
                <TeamManager
                    teams={teams}
                    currentTeam={null}
                    onSelectTeam={handleSelectTeam}
                    onAddTeam={handleAddTeam}
                    onDeleteTeam={handleDeleteTeam}
                    onEditTeam={handleEditTeam}
                />
            </main>
        </div>
    );
}
