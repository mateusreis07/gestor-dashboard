import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Users, ArrowLeft, BarChart3 } from 'lucide-react';
import styles from './LoginPage.module.css';

export function LoginPage() {
    const { role: roleParam } = useParams<{ role: string }>();
    const role = roleParam as 'manager' | 'team';
    const navigate = useNavigate();
    const { login, logout } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const loggedUser = await login(email, password);
        console.log('[LOGIN] loggedUser retornado:', loggedUser);

        if (loggedUser) {
            // Validate if the user role matches the login page they are trying to access
            const isManagerLogin = role === 'manager';
            const isUserManager = loggedUser.role === 'MANAGER';

            if (isManagerLogin !== isUserManager) {
                // Roles mismatch: they are logging into the wrong portal
                logout(); // remove the token stored by authService during login
                setError(`Acesso negado: Este e-mail não pertence a um ${isManagerLogin ? 'Gestor' : 'Time'}.`);
                return;
            }

            console.log('[LOGIN] token no localStorage:', localStorage.getItem('token'));
            console.log('[LOGIN] user no localStorage:', localStorage.getItem('user'));

            const destino = loggedUser.role === 'MANAGER'
                ? '/app/overview'
                : `/app/team/${loggedUser.id}`;
            console.log('[LOGIN] Navegando para:', destino);
            window.location.href = destino;
        } else {
            setError('E-mail ou senha inválidos. Verifique suas credenciais.');
        }
    };

    const handleBack = () => navigate('/welcome');

    return (
        <div className={styles.container}>
            {/* Left side: branding & typography */}
            <div className={styles.heroSection}>
                <div className={styles.gridOverlay}></div>
                <div className={styles.noiseOverlay}></div>

                <div className={styles.brandWrapper}>
                    <div className={styles.logo} onClick={handleBack}>
                        <BarChart3 size={32} color={role === 'manager' ? '#38bdf8' : '#4ade80'} />
                        <span className={styles.logoText}>GestorOS</span>
                    </div>
                </div>

                <div className={styles.heroContent}>
                    <h1 className={styles.headline}>
                        Acesso
                        <br />
                        <span className={role === 'manager' ? styles.gradientTextManager : styles.gradientTextTeam}>
                            {role === 'manager' ? 'Autenticado' : 'Operacional'}
                        </span>
                    </h1>
                    <p className={styles.heroSub}>
                        {role === 'manager'
                            ? 'Insira suas credenciais corporativas para acessar o painel de diretoria e gerenciar indicadores globais.'
                            : 'Identifique-se para atualizar painéis setoriais, dados locais e reportar os chamados da sua unidade.'}
                    </p>
                </div>

                <div className={styles.footerInfo}>
                    <span>&copy; {new Date().getFullYear()} Gestor System. Ambiente Seguro.</span>
                </div>
            </div>

            {/* Right side: Login form */}
            <div className={styles.loginSection}>
                <button onClick={handleBack} className={styles.backButton}>
                    <ArrowLeft size={16} />
                    Voltar
                </button>

                <div className={styles.formContainer}>
                    <div className={`${styles.roleIconWrapper} ${role === 'manager' ? styles.manager : styles.team}`}>
                        {role === 'manager' ? <User size={28} color="#38bdf8" /> : <Users size={28} color="#4ade80" />}
                    </div>

                    <h2 className={styles.formTitle}>
                        Portal do {role === 'manager' ? 'Gestor' : 'Time'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>E-mail Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={`${styles.inputField} ${role === 'manager' ? styles.managerFocus : styles.teamFocus}`}
                                placeholder="usuario@email.com"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`${styles.inputField} ${role === 'manager' ? styles.managerFocus : styles.teamFocus}`}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className={styles.errorMessage}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`${styles.submitButton} ${role === 'manager' ? styles.manager : styles.team}`}
                        >
                            <LogIn size={18} />
                            Fazer Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
