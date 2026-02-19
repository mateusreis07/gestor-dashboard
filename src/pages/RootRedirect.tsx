import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RootRedirect() {
    const { isAuthenticated, isManagerConfigured, role, user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>
                Carregando...
            </div>
        );
    }

    // If no manager is configured yet, go to setup
    if (!isManagerConfigured) {
        return <Navigate to="/setup" replace />;
    }

    // If authenticated, redirect to appropriate dashboard
    if (isAuthenticated) {
        if (role === 'manager') {
            return <Navigate to="/app/overview" replace />;
        } else if (role === 'team' && user && 'id' in user) {
            return <Navigate to={`/app/team/${user.id}`} replace />;
        }
    }

    // Default: go to welcome/landing page
    return <Navigate to="/welcome" replace />;
}
