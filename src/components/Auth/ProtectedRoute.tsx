import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface Props {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }

    return <>{children}</>;
}
