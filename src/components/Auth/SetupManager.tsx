
import { useState } from 'react';
import { LayoutDashboard, CheckCircle } from 'lucide-react';
import type { Manager } from '../../utils/types';

interface Props {
    onComplete: (manager: Manager) => void;
}

export function SetupManager({ onComplete }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password) {
            setError('Todos os campos são obrigatórios.');
            return;
        }

        const manager: Manager = { name, email, password };
        onComplete(manager);
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)', padding: '20px'
        }}>
            <div style={{
                background: 'white', padding: '40px', borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{
                    background: '#e6f7ff', padding: '12px', borderRadius: '50%', marginBottom: '20px',
                    color: '#1890ff'
                }}>
                    <LayoutDashboard size={32} />
                </div>

                <h1 style={{ marginBottom: '8px', fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                    Configuração Inicial
                </h1>
                <p style={{ marginBottom: '32px', color: '#6b7280', textAlign: 'center' }}>
                    Crie sua conta de Gestor para administrar os times e dashboards.
                </p>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                            Nome do Gestor
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '8px',
                                border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem'
                            }}
                            placeholder="Ex: João Silva"
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                            E-mail de Acesso
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '8px',
                                border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem'
                            }}
                            placeholder="joao@empresa.com"
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
                            placeholder="******"
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
                            background: '#1890ff', color: 'white', fontWeight: 600, fontSize: '0.95rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'background 0.2s'
                        }}
                    >
                        <CheckCircle size={18} />
                        Criar Conta e Acessar
                    </button>
                </form>
            </div>
        </div>
    );
}
