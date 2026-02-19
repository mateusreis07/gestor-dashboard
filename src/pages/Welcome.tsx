import { useNavigate } from 'react-router-dom';
import { LandingPage } from '../components/Landing/LandingPage';

export function Welcome() {
    const navigate = useNavigate();

    return (
        <LandingPage
            onSelectRole={(role) => navigate(`/login/${role}`)}
        />
    );
}
