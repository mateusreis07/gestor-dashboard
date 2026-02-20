import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export function Setup() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.register({ name, email, password, role: 'MANAGER' });
            navigate('/login/manager');
        } catch (err: any) {
            console.error('Setup Error:', err);
            if (err.status === 429) {
                setError('Muitas tentativas de registro. Aguarde alguns minutos e tente novamente.');
            } else {
                setError(err.message || 'Erro ao criar gestor. Verifique os dados ou tente mais tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)', padding: '20px'
        }}>
            <div style={{
                background: 'white', padding: '40px', borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px'
            }}>
                <h1 style={{ marginBottom: '8px', fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', textAlign: 'center' }}>
                    Configurar Gestor
                </h1>
                <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: '24px', fontSize: '0.875rem' }}>
                    Crie a conta de gestor principal do sistema.
                </p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>Nome</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>E-mail</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>Senha</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '0.9rem' }} />
                    </div>
                    {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</p>}
                    <button type="submit" disabled={loading}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                            background: '#1890ff', color: 'white', fontWeight: 600, fontSize: '0.95rem',
                            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                        }}>
                        {loading ? 'Criando...' : 'Criar Gestor e Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
