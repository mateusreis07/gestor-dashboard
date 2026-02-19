import { useState } from 'react';
import type { Team } from '../../utils/types';
import styles from './TeamManager.module.css';
import { Trash2, Users, Pencil, X, Check } from 'lucide-react';

interface Props {
    teams: Team[];
    currentTeam: Team | null;
    onSelectTeam: (team: Team) => void;
    onAddTeam?: (name: string, email: string, password?: string) => void;
    onDeleteTeam?: (teamId: string) => void;
    onEditTeam?: (teamId: string, data: { name?: string; email?: string; password?: string }) => void;
}

export function TeamManager({ teams, currentTeam, onSelectTeam, onAddTeam, onDeleteTeam, onEditTeam }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Edit state
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !onAddTeam) return;

        onAddTeam(name.trim(), email.trim(), password.trim());
        setName('');
        setEmail('');
        setPassword('');
        setIsCreating(false);
    };

    const startEditing = (team: Team) => {
        setEditingTeamId(team.id);
        setEditName(team.name);
        setEditEmail(team.email);
        setEditPassword(team.password || '');
    };

    const cancelEditing = () => {
        setEditingTeamId(null);
        setEditName('');
        setEditEmail('');
        setEditPassword('');
    };

    const handleSaveEdit = (teamId: string) => {
        if (!editName.trim() || !editEmail.trim() || !onEditTeam) return;

        onEditTeam(teamId, {
            name: editName.trim(),
            email: editEmail.trim(),
            password: editPassword.trim() || undefined,
        });
        cancelEditing();
    };

    if (teams.length === 0 && onAddTeam) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <div style={{ background: '#e6f7ff', padding: '20px', borderRadius: '50%', display: 'inline-flex', marginBottom: '24px' }}>
                        <Users size={48} color="#1890ff" strokeWidth={1.5} />
                    </div>
                    <h2 className={styles.title} style={{ marginBottom: '12px' }}>Bem-vindo ao Gestor</h2>
                    <p style={{ color: '#6b7280', marginBottom: '32px', maxWidth: '300px', margin: '0 auto 32px' }}>
                        Você ainda não possui times cadastrados. Crie seu primeiro time para começar a gerenciar os chamados.
                    </p>

                    <form onSubmit={handleAdd} className={styles.createForm} style={{ animation: 'none', border: 'none', background: 'transparent', padding: 0 }}>
                        <div className={styles.inputGroup}>
                            <input type="text" placeholder="Nome do Time (ex: Suporte N1)" value={name} onChange={e => setName(e.target.value)} className={styles.input} />
                            <input type="email" placeholder="E-mail de acesso" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} />
                            <input type="text" placeholder="Senha de acesso" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} />
                        </div>
                        <button type="submit" className={styles.button} style={{ width: '100%', marginTop: '24px' }}>Criar Primeiro Time</button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}>
                        <Users size={24} color="#1890ff" />
                    </div>
                    <div>
                        <h3 className={styles.title} style={{ margin: 0, fontSize: '1.25rem' }}>Meus Times</h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Gerencie suas equipes e acessos</p>
                    </div>
                </div>

                {onAddTeam && !isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className={styles.button}
                        style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span>+</span> Novo Time
                    </button>
                )}
            </div>

            {isCreating && onAddTeam && (
                <div className={styles.createForm}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>Novo Time</h4>
                        <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleAdd}>
                        <div className={styles.inputGroup} style={{ marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Nome da Equipe</label>
                                <input type="text" placeholder="Ex: Financeiro" value={name} onChange={e => setName(e.target.value)} className={styles.input} autoFocus />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>E-mail de Login</label>
                                    <input type="email" placeholder="time@empresa.com" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Senha Inicial</label>
                                    <input type="text" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setIsCreating(false)} className={styles.buttonSecondary}>Cancelar</button>
                            <button type="submit" className={styles.button}>Salvar Time</button>
                        </div>
                    </form>
                </div>
            )}

            <ul className={styles.teamList}>
                {teams.map((team) => (
                    <li
                        key={team.id}
                        className={`${styles.teamItem} ${currentTeam?.id === team.id ? styles.active : ''} ${editingTeamId === team.id ? styles.editing : ''}`}
                    >
                        {editingTeamId === team.id ? (
                            /* ===== EDIT MODE ===== */
                            <div className={styles.editForm}>
                                <div className={styles.inputGroup}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className={styles.input}
                                            autoFocus
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</label>
                                            <input
                                                type="email"
                                                value={editEmail}
                                                onChange={e => setEditEmail(e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
                                            <input
                                                type="text"
                                                value={editPassword}
                                                onChange={e => setEditPassword(e.target.value)}
                                                className={styles.input}
                                                placeholder="Nova senha (ou manter)"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button
                                        onClick={cancelEditing}
                                        className={styles.buttonSecondary}
                                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <X size={14} /> Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleSaveEdit(team.id)}
                                        className={styles.button}
                                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Check size={14} /> Salvar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ===== VIEW MODE ===== */
                            <>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}
                                    onClick={() => onSelectTeam(team)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: team.name ? `hsl(${team.name.length * 30}, 80%, 90%)` : '#e5e7eb',
                                        color: team.name ? `hsl(${team.name.length * 30}, 80%, 30%)` : '#6b7280',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '1rem', flexShrink: 0
                                    }}>
                                        {team.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '1rem' }}>{team.name}</span>
                                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                            {team.email || 'Sem e-mail configurado'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {onEditTeam && (
                                        <button
                                            className={styles.editButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditing(team);
                                            }}
                                            title="Editar Time"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    )}
                                    {onDeleteTeam && (
                                        <button
                                            className={styles.deleteButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Tem certeza que deseja deletar o time "${team.name}"?`)) {
                                                    onDeleteTeam(team.id);
                                                }
                                            }}
                                            title="Deletar Time"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
