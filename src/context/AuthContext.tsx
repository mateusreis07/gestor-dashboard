import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Manager, Team } from '../utils/types';
import { loadManager, loadTeams, saveManager } from '../utils/storage';

const SESSION_KEY = 'gestor_dashboard_session';

interface SessionData {
    role: 'manager' | 'team';
    email: string;
}

interface AuthContextType {
    user: Manager | Team | null;
    role: 'manager' | 'team' | null;
    isAuthenticated: boolean;
    isManagerConfigured: boolean;
    loading: boolean;
    login: (role: 'manager' | 'team', email: string, password?: string) => Promise<boolean>;
    logout: () => void;
    setupManager: (manager: Manager) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function saveSession(role: 'manager' | 'team', email: string) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, email }));
}

function loadSession(): SessionData | null {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Manager | Team | null>(null);
    const [role, setRole] = useState<'manager' | 'team' | null>(null);
    const [isManagerConfigured, setIsManagerConfigured] = useState(false);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const manager = loadManager();
        if (manager) {
            setIsManagerConfigured(true);
        }

        // Try to restore a previous session
        const session = loadSession();
        if (session) {
            if (session.role === 'manager' && manager && manager.email === session.email) {
                setUser(manager);
                setRole('manager');
            } else if (session.role === 'team') {
                const teams = loadTeams();
                const team = teams.find(t => t.email === session.email);
                if (team) {
                    setUser(team);
                    setRole('team');
                } else {
                    clearSession();
                }
            } else {
                clearSession();
            }
        }

        setLoading(false);
    }, []);

    const login = async (selectedRole: 'manager' | 'team', email: string, password?: string) => {
        if (selectedRole === 'manager') {
            const manager = loadManager();
            if (manager && manager.email === email && manager.password === password) {
                setUser(manager);
                setRole('manager');
                saveSession('manager', email);
                return true;
            }
        } else {
            const teams = loadTeams();
            const team = teams.find(t => t.email === email && (t.password === password || !t.password));
            if (team) {
                setUser(team);
                setRole('team');
                saveSession('team', email);
                return true;
            }
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        clearSession();
    };

    const setupManager = (manager: Manager) => {
        saveManager(manager);
        setIsManagerConfigured(true);
    };

    return (
        <AuthContext.Provider value={{
            user,
            role,
            isAuthenticated: !!user,
            isManagerConfigured,
            loading,
            login,
            logout,
            setupManager
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
