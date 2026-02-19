import { useNavigate } from 'react-router-dom';
import { SetupManager } from '../components/Auth/SetupManager';
import { useAuth } from '../context/AuthContext';
import type { Manager } from '../utils/types';

export function Setup() {
    const { setupManager } = useAuth();
    const navigate = useNavigate();

    const handleComplete = (manager: Manager) => {
        setupManager(manager);
        navigate('/welcome');
    };

    return <SetupManager onComplete={handleComplete} />;
}
