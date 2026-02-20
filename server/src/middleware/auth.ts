import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { prisma } from '../prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase Auth Error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Sincronizar usuário no banco local (Prisma)
    // Precisamos disso para as Foreign Keys funcionarem
    let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    if (!dbUser && user.email) {
      // Se não achou pelo ID, tenta pelo e-mail (caso seja usuário legado)
      dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (dbUser) {
        console.log(`[Auth Sync] Found legacy user by email: ${user.email} (Local ID: ${dbUser.id})`);
      }
    }

    if (!dbUser) {
      // Se não existe, cria um registro básico baseando-se no auth
      // Precisamos de email e password (mesmo sendo dummy)
      // Role default: TEAM, pode atualizar se vier do metadata se configurado
      const role = user.user_metadata?.role || 'TEAM';

      console.log(`[Auth Sync] Creating local user for ${user.email} (${user.id})`);
      try {
        dbUser = await prisma.user.create({
          data: {
            id: user.id, // Usa o UUID do Supabase como ID local
            email: user.email!,
            password: 'supabase_auth_managed', // Senha dummy, autenticação via Supabase
            name: user.user_metadata?.name || user.email?.split('@')[0],
            role: role === 'MANAGER' ? 'MANAGER' : 'TEAM'
          }
        });
      } catch (createError) {
        // Se falhar na criação (concorrência), tenta buscar de novo
        console.warn('[Auth Sync] Create failed, retrying fetch:', createError);
        dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) throw createError;
      }
    }

    // Anexar user ao request (compatível com controllers existentes)
    (req as any).user = { userId: dbUser.id, role: dbUser.role };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
