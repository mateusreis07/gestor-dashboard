import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function RootRedirect() {
    const { isAuthenticated, role, user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '16px' }}>
                <Loader2 size={40} color="#0ea5e9" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '1rem' }}>Verificando sessão...</span>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Se autenticado, redireciona para o dashboard correto
    if (isAuthenticated) {
        if (role === 'MANAGER') {
            return <Navigate to="/app/overview" replace />;
        } else if (role === 'TEAM' && user) {
            return <Navigate to={`/app/team/${user.id}`} replace />;
        }
    }

    // Padrão: vai para a tela de boas-vindas/login
    return <Navigate to="/welcome" replace />;
}
