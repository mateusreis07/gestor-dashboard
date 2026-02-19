
import { useState } from 'react';
import { loadManager, loadTeams } from '../../utils/storage';
import { LogIn, User, Users } from 'lucide-react';
import type { Manager, Team } from '../../utils/types';

interface Props {
    role: 'manager' | 'team';
    onLoginSuccess: (user: Manager | Team) => void;
    onBack: () => void;
}

export function Login({ role, onLoginSuccess, onBack }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (role === 'manager') {
            const manager = loadManager();
            if (manager && manager.email === email && manager.password === password) {
                onLoginSuccess(manager);
            } else {
                setError('Credenciais inválidas.');
            }
        } else {
            const teams = loadTeams();
            const team = teams.find(t => t.email === email && t.password === password);
            if (team) {
                onLoginSuccess(team);
            } else {
                setError('Credenciais de time inválidas.');
            }
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)', padding: '20px'
        }}>
            <div style={{
                background: 'white', padding: '40px', borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                position: 'relative'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        position: 'absolute', top: '20px', left: '20px', border: 'none', background: 'transparent',
                        color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem'
                    }}
                >
                    &larr; Voltar
                </button>

                <div style={{
                    background: role === 'manager' ? '#e6f7ff' : '#f6ffed',
                    padding: '12px', borderRadius: '50%', marginBottom: '20px',
                    color: role === 'manager' ? '#1890ff' : '#52c41a'
                }}>
                    {role === 'manager' ? <User size={32} /> : <Users size={32} />}
                </div>

                <h1 style={{ marginBottom: '8px', fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                    Login {role === 'manager' ? 'Gestor' : 'Time'}
                </h1>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                            E-mail
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '8px',
                                border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                            Senha
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '8px',
                                border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{ marginBottom: '16px', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                            background: role === 'manager' ? '#1890ff' : '#52c41a',
                            color: 'white', fontWeight: 600, fontSize: '0.95rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        <LogIn size={18} />
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
}
