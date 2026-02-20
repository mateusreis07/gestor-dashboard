import { supabase } from '../lib/supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'MANAGER' | 'TEAM';
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'MANAGER' | 'TEAM';
}

export const authService = {
  async login({ email, password }: LoginCredentials): Promise<{ token: string; user: AuthUser }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session || !data.user) throw new Error("Falha no login: Sem sessão iniciada.");

    const token = data.session.access_token;
    const userSupabase = data.user;

    // Mapeia metadados ou usa defaults
    const role = (userSupabase.user_metadata?.role as 'MANAGER' | 'TEAM') || 'TEAM';

    const user: AuthUser = {
      id: userSupabase.id,
      email: userSupabase.email!,
      name: userSupabase.user_metadata?.name || userSupabase.email?.split('@')[0],
      role: role
    };

    // Mantém compatibilidade com api.ts salvando no localStorage
    // Nota: Em produção idealmente usaríamos o onAuthStateChange para manter atualizado
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  },

  async register(data: RegisterData): Promise<{ user: AuthUser }> {
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role || 'TEAM'
        }
      }
    });

    if (error) throw error;
    if (!result.user) throw new Error("Registro falhou.");

    const role = (result.user.user_metadata?.role as 'MANAGER' | 'TEAM') || 'TEAM';

    const user: AuthUser = {
      id: result.user.id,
      email: result.user.email!,
      name: result.user.user_metadata?.name || data.name,
      role: role
    };

    // Se autoSignIn estiver ativo (sem confirmação de email), salva sessão
    if (result.session) {
      localStorage.setItem('token', result.session.access_token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    return { user };
  },

  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
