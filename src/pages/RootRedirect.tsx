import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RootRedirect() {
    const { isAuthenticated, role, user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>
                Carregando...
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
