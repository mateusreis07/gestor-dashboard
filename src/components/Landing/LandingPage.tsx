import styles from './LandingPage.module.css';
import { Briefcase, Users, BarChart3, ArrowRight, ShieldCheck, Database, Zap } from 'lucide-react';

interface Props {
    onSelectRole: (role: 'manager' | 'team') => void;
}

export function LandingPage({ onSelectRole }: Props) {
    return (
        <div className={styles.container}>
            {/* Left side: branding & typography */}
            <div className={styles.heroSection}>
                <div className={styles.gridOverlay}></div>
                <div className={styles.noiseOverlay}></div>

                <div className={styles.brandWrapper}>
                    <div className={styles.logo}>
                        <BarChart3 size={32} color="#38bdf8" />
                        <span className={styles.logoText}>GestorOS</span>
                    </div>
                </div>

                <div className={styles.heroContent}>
                    <h1 className={styles.headline}>
                        Inteligência
                        <br /><span className={styles.gradientText}>Operacional</span>
                    </h1>
                    <p className={styles.heroSub}>
                        A plataforma definitiva para controle de chamados, gestão de times e visão consolidada de performance departamental.
                    </p>

                    <div className={styles.features}>
                        <div className={styles.featureItem}>
                            <ShieldCheck size={20} color="#38bdf8" />
                            <span>Alta Segurança</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Database size={20} color="#38bdf8" />
                            <span>Controle de Dados</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Zap size={20} color="#38bdf8" />
                            <span>Métricas em Tempo Real</span>
                        </div>
                    </div>
                </div>

                <div className={styles.footerInfo}>
                    <span>&copy; {new Date().getFullYear()} Gestor System. Todos os direitos reservados.</span>
                </div>
            </div>

            {/* Right side: Login panels */}
            <div className={styles.loginSection}>
                <div className={styles.loginHeader}>
                    <h2>Acesso ao Sistema</h2>
                    <p>Identifique-se para entrar na plataforma</p>
                </div>

                <div className={styles.cardsContainer}>
                    {/* Manager Card */}
                    <button
                        className={`${styles.roleCard} ${styles.managerCard}`}
                        onClick={() => onSelectRole('manager')}
                    >
                        <div className={styles.cardGlow}></div>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconBox}>
                                <Briefcase size={24} color="#38bdf8" />
                            </div>
                            <ArrowRight size={20} className={styles.arrowIcon} />
                        </div>
                        <div className={styles.cardBody}>
                            <h3>Portal do Gestor</h3>
                            <p>Gestão de times, indicadores estratégicos corporativos e configurações globais da empresa.</p>
                        </div>
                    </button>

                    {/* Team Card */}
                    <button
                        className={`${styles.roleCard} ${styles.teamCard}`}
                        onClick={() => onSelectRole('team')}
                    >
                        <div className={styles.cardGlow}></div>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconBoxTeam}>
                                <Users size={24} color="#4ade80" />
                            </div>
                            <ArrowRight size={20} className={styles.arrowIcon} />
                        </div>
                        <div className={styles.cardBody}>
                            <h3>Portal do Time</h3>
                            <p>Atualização de painéis, importação de demandas em planilhas e visões quantitativas de chamados setoriais.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
