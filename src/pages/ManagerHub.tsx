import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { managerTeamsService } from '../services/teamService';
import { ArrowLeft, Settings, Plus, Trash2, Edit2, Eye, Image as ImageIcon } from 'lucide-react';
import styles from './ManagerHub.module.css';

interface Team {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    avatarUrl?: string | null;
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
    const [formAvatar, setFormAvatar] = useState<string | null>(null);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
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
        setFormAvatar(team.avatarUrl || null);
        setFormError('');
        setShowForm(true);
    };

    const openCreateForm = () => {
        setEditingTeam(null);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormAvatar(null);
        setFormError('');
        setShowForm(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setFormError('A imagem deve ter no máximo 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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
                if (formAvatar && formAvatar !== editingTeam.avatarUrl) {
                    updateData.avatarBase64 = formAvatar;
                }
                await managerTeamsService.updateTeam(editingTeam.id, updateData);
            } else {
                if (!formPassword) {
                    setFormError('A senha é obrigatória para criar um time.');
                    setSaving(false);
                    return;
                }
                await managerTeamsService.createTeam(formName, formEmail, formPassword, formAvatar || undefined);
            }
            setShowForm(false);
            await fetchTeams();
        } catch (err: any) {
            console.error('Detailed API Error:', err.response?.data || err);
            const rawError = err?.response?.data?.error || err?.response?.data?.message || err?.message;
            const errorMsg = typeof rawError === 'string'
                ? rawError
                : (rawError ? JSON.stringify(rawError) : 'Erro ao salvar time. Verifique sua conexão.');
            setFormError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (team: Team) => {
        if (!confirm(`Tem certeza que deseja deletar o time "${team.name}"? Esta ação é irreversível.`)) return;
        try {
            await managerTeamsService.deleteTeam(team.id);
            await fetchTeams();
        } catch (err) {
            alert('Erro ao deletar time. Tente novamente.');
        }
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        onClick={() => navigate('/app/overview')}
                        className={styles.backButton}
                        title="Voltar ao Painel"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className={styles.iconBox}>
                        <Settings color="#ffffff" size={22} />
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>Gerenciar Times</h1>
                        {user && <p>Criar, editar e remover equipes</p>}
                    </div>
                </div>
                <button onClick={openCreateForm} className={styles.addButton}>
                    <Plus size={18} />
                    <span>Novo Time</span>
                </button>
            </header>

            <main className={styles.main}>
                {/* Form Modal */}
                {showForm && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <h2 className={styles.modalTitle}>
                                {editingTeam ? 'Editar Time' : 'Novo Time'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.avatarPicker}>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={styles.avatarCircle}
                                        style={formAvatar ? { background: `url(${formAvatar}) center/cover`, borderStyle: 'solid' } : {}}
                                        title="Clique para alterar a foto do time"
                                    >
                                        {!formAvatar && <ImageIcon color="#94a3b8" size={32} />}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/png, image/jpeg, image/jpg"
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Nome do Time</label>
                                    <input
                                        type="text" value={formName} onChange={e => setFormName(e.target.value)}
                                        placeholder="Equipe de Suporte"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>E-mail</label>
                                    <input
                                        type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>
                                        Senha {editingTeam && <span>(deixe em branco para manter)</span>}
                                    </label>
                                    <input
                                        type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)}
                                        required={!editingTeam}
                                    />
                                </div>
                                {formError && <div className={styles.formError}>{formError}</div>}
                                <div className={styles.formActions}>
                                    <button
                                        type="button" onClick={() => setShowForm(false)}
                                        className={styles.cancelButton}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit" disabled={saving}
                                        className={styles.submitButton}
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
                    <div className={styles.loadingState}>Carregando times...</div>
                ) : teams.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Nenhum time cadastrado.</p>
                        <p>Clique em "Novo Time" para começar.</p>
                    </div>
                ) : (
                    <div className={styles.teamList}>
                        {teams.map(team => (
                            <div key={team.id} className={styles.teamRow}>
                                <div className={styles.teamInfo}>
                                    <div
                                        className={styles.teamAvatar}
                                        style={team.avatarUrl ? { background: `url(${team.avatarUrl}) center/cover`, border: 'none' } : {}}
                                    >
                                        {!team.avatarUrl && <ImageIcon size={20} color="#94a3b8" />}
                                    </div>
                                    <div>
                                        <p className={styles.teamName}>{team.name || 'Sem nome'}</p>
                                        <p className={styles.teamEmail}>{team.email}</p>
                                    </div>
                                </div>
                                <div className={styles.teamActions}>
                                    <button
                                        onClick={() => navigate(`/app/team/${team.id}`)}
                                        title="Ver Dashboard"
                                        className={styles.actionButton}
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => openEditForm(team)}
                                        title="Editar"
                                        className={styles.actionButton}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(team)}
                                        title="Deletar"
                                        className={styles.deleteButton}
                                    >
                                        <Trash2 size={16} />
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
