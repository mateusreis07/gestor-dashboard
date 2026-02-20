import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { managerTeamsService } from '../services/teamService';
import { ArrowLeft, Settings, Plus, Trash2, Edit2, Eye } from 'lucide-react';

interface Team {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

export function ManagerHub() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const data = await managerTeamsService.listTeams();
            if (Array.isArray(data)) {
                setTeams(data);
            } else {
                console.error('Dados de times inválidos (esperado array):', data);
                setTeams([]);
            }
        } catch (err) {
            console.error('Erro ao carregar times:', err);
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    const openEditForm = (team: Team) => {
        setEditingTeam(team);
        setFormName(team.name || '');
        setFormEmail(team.email);
        setFormPassword('');
        setFormError('');
        setShowForm(true);
    };

    const openCreateForm = () => {
        setEditingTeam(null);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormError('');
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);
        try {
            if (editingTeam) {
                const updateData: any = {};
                if (formName) updateData.name = formName;
                if (formEmail) updateData.email = formEmail;
                if (formPassword) updateData.password = formPassword;
                await managerTeamsService.updateTeam(editingTeam.id, updateData);
            } else {
                if (!formPassword) {
                    setFormError('A senha é obrigatória para criar um time.');
                    setSaving(false);
                    return;
                }
                await managerTeamsService.createTeam(formName, formEmail, formPassword);
            }
            setShowForm(false);
            await loadTeams();
        } catch (err: any) {
            setFormError(err?.response?.data?.error || 'Erro ao salvar time. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (team: Team) => {
        if (!confirm(`Tem certeza que deseja deletar o time "${team.name}"? Esta ação é irreversível.`)) return;
        try {
            await managerTeamsService.deleteTeam(team.id);
            await loadTeams();
        } catch (err) {
            alert('Erro ao deletar time. Tente novamente.');
        }
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
                            cursor: 'pointer'
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
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                            Gerenciar Times
                        </h1>
                        {user && (
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '2px 0 0 0' }}>
                                Criar, editar e remover equipes
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={openCreateForm}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', background: '#1890ff', color: 'white',
                        border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    <Plus size={18} />
                    Novo Time
                </button>
            </header>

            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
                {/* Form Modal */}
                {showForm && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
                    }}>
                        <div style={{
                            background: 'white', borderRadius: '16px', padding: '32px',
                            width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                        }}>
                            <h2 style={{ marginBottom: '24px', fontWeight: 700, color: '#1f2937' }}>
                                {editingTeam ? 'Editar Time' : 'Novo Time'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>Nome do Time</label>
                                    <input
                                        type="text" value={formName} onChange={e => setFormName(e.target.value)}
                                        placeholder="Equipe de Suporte"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>E-mail</label>
                                    <input
                                        type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                                        Senha {editingTeam && <span style={{ color: '#9ca3af', fontWeight: 400 }}>(deixe em branco para manter)</span>}
                                    </label>
                                    <input
                                        type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)}
                                        required={!editingTeam}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '0.9rem' }}
                                    />
                                </div>
                                {formError && <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.875rem' }}>{formError}</p>}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button" onClick={() => setShowForm(false)}
                                        style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 500 }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit" disabled={saving}
                                        style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#1890ff', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
                                    >
                                        {saving ? 'Salvando...' : editingTeam ? 'Salvar' : 'Criar Time'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Teams List */}
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>Carregando times...</div>
                ) : teams.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Nenhum time cadastrado.</p>
                        <p style={{ fontSize: '0.875rem' }}>Clique em "Novo Time" para começar.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {teams.map(team => (
                            <div key={team.id} style={{
                                background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
                                padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                            }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>{team.name || 'Sem nome'}</p>
                                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>{team.email}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => navigate(`/app/team/${team.id}`)}
                                        title="Ver Dashboard"
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <Eye size={16} color="#374151" />
                                    </button>
                                    <button
                                        onClick={() => openEditForm(team)}
                                        title="Editar"
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <Edit2 size={16} color="#374151" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(team)}
                                        title="Deletar"
                                        style={{ padding: '8px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <Trash2 size={16} color="#ef4444" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
