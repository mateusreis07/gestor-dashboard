import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Props {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>
                Carregando...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }

    return <>{children}</>;
}
