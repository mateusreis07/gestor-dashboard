import { createContext, useContext, useState, type ReactNode } from 'react';
import { authService, type AuthUser } from '../services/authService';

interface AuthContextType {
    user: AuthUser | null;
    role: 'MANAGER' | 'TEAM' | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthUser | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Inicialização SÍNCRONA: lê o usuário do localStorage imediatamente,
    // sem esperar por um useEffect. Isso elimina a condição de corrida.
    const [user, setUser] = useState<AuthUser | null>(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser && authService.isAuthenticated()) {
            return currentUser;
        }
        return null;
    });

    // Sem loading state necessário — a inicialização é síncrona
    const loading = false;

    const login = async (email: string, password: string): Promise<AuthUser | null> => {
        try {
            const { user: loggedUser } = await authService.login({ email, password });
            setUser(loggedUser);
            return loggedUser;
        } catch (error) {
            console.error('Login failed:', error);
            return null;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            role: user?.role ?? null,
            isAuthenticated: !!user,
            loading,
            login,
            logout,
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
