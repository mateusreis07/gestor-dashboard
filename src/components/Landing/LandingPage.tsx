
import styles from './LandingPage.module.css';
import { Briefcase, Users } from 'lucide-react';

interface Props {
    onSelectRole: (role: 'manager' | 'team') => void;
}

export function LandingPage({ onSelectRole }: Props) {
    return (
        <div className={styles.container}>
            <div style={{ textAlign: 'center' }}>
                <h1 className={styles.title}>Gestor Dashboard</h1>
                <p className={styles.subtitle}>Selecione seu perfil de acesso</p>
            </div>

            <div className={styles.cardContainer}>
                {/* Manager Card */}
                <div
                    className={`${styles.card} ${styles.managerCard}`}
                    onClick={() => onSelectRole('manager')}
                >
                    <div className={styles.iconWrapper}>
                        <Briefcase size={32} color="#1890ff" />
                    </div>
                    <h2 className={styles.roleTitle}>Sou Gestor</h2>
                    <p className={styles.roleDesc}>
                        Gerencie times, visualize relatórios consolidados e acompanhe métricas.
                    </p>
                </div>

                {/* Team Card */}
                <div
                    className={`${styles.card} ${styles.teamCard}`}
                    onClick={() => onSelectRole('team')}
                >
                    <div className={styles.iconWrapper}>
                        <Users size={32} color="#52c41a" />
                    </div>
                    <h2 className={styles.roleTitle}>Sou do Time</h2>
                    <p className={styles.roleDesc}>
                        Acesse métricas da sua equipe e faça importação mensal de dados.
                    </p>
                </div>
            </div>
        </div>
    );
}
