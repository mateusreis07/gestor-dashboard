import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { supabase, supabaseAdmin } from '../lib/supabase';

async function uploadAvatar(userId: string, base64: string): Promise<string | null> {
  const client = supabaseAdmin || supabase;

  if (!client) {
    console.warn('No Supabase client available for uploadAvatar');
    return null;
  }

  try {
    // try to create bucket 'avatars' (only admin might have permission)
    if (supabaseAdmin) {
      await supabaseAdmin.storage.createBucket('avatars', { public: true }).catch(() => { });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = contentType.split('/')[1] || 'png';
    const filename = `${userId}-${Date.now()}.${ext}`;

    const { error } = await client.storage
      .from('avatars')
      .upload(filename, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return null;
    }

    const { data } = client.storage.from('avatars').getPublicUrl(filename);
    return data.publicUrl;
  } catch (error) {
    console.error('Upload avatar error:', error);
    return null;
  }
}

// Listar todos os times
export const listTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.user.findMany({
      where: { role: 'TEAM' },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { tickets: true, chamados: true }
        }
      }
    });

    const mappedTeams = teams.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      avatarUrl: t.avatarUrl,
      createdAt: t.createdAt,
      ticketCount: t._count.tickets + t._count.chamados
    }));

    res.json(mappedTeams);
  } catch (error) {
    console.error('List teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Criar um novo time
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, email, password, avatarBase64 } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // 1. Criar usuário no Supabase Auth
    let supabaseUserId: string;

    if (supabaseAdmin) {
      // Usar Admin API (service role) - cria sem confirmação de email
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'TEAM' }
      });

      if (error) {
        console.error('Supabase Admin createUser error:', error);
        return res.status(400).json({ error: error.message || 'Erro ao criar usuário no auth' });
      }
      supabaseUserId = data.user.id;
    } else {
      // Fallback: usar signUp (anon key) - pode exigir confirmação de email
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: 'TEAM' } }
      });

      if (error) {
        console.error('Supabase signUp error:', error);
        return res.status(400).json({ error: error.message || 'Erro ao criar usuário no auth' });
      }
      supabaseUserId = data.user!.id;
    }

    // Handle avatar upload
    let avatarUrl = null;
    if (avatarBase64) {
      avatarUrl = await uploadAvatar(supabaseUserId, avatarBase64);
    }

    // 2. Criar usuário no banco local (Prisma) com o ID do Supabase
    const team = await prisma.user.create({
      data: {
        id: supabaseUserId,
        name,
        email,
        password: 'supabase_auth_managed',
        role: 'TEAM',
        avatarUrl
      },
      select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true }
    });

    console.log(`[Teams] Created team: ${name} (${email}) -> ID: ${supabaseUserId}`);
    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Atualizar time
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, email, password, avatarBase64 } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      const conflict = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (conflict) return res.status(400).json({ error: 'E-mail já em uso' });
      updateData.email = email;
    }
    if (password) updateData.password = 'supabase_auth_managed';

    // Handle avatar upload
    if (avatarBase64) {
      const newAvatarUrl = await uploadAvatar(id, avatarBase64);
      if (newAvatarUrl) {
        updateData.avatarUrl = newAvatarUrl;
      }
    }

    // Atualizar no banco local
    const team = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, avatarUrl: true }
    });

    // Atualizar no Supabase Auth (se admin disponível)
    if (supabaseAdmin && (email || password)) {
      const authUpdate: any = {};
      if (email) authUpdate.email = email;
      if (password) authUpdate.password = password;

      await supabaseAdmin.auth.admin.updateUserById(id, authUpdate)
        .catch(err => console.warn('[Teams] Failed to update Supabase Auth user:', err.message));
    }

    res.json(team);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Deletar time e seus dados
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    // Transaction para garantir atomicidade: ou apaga tudo ou nada
    await prisma.$transaction([
      prisma.ticket.deleteMany({ where: { userId: id } }),
      prisma.chamado.deleteMany({ where: { userId: id } }),
      prisma.monthlyData.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    // Remover do Supabase Auth (se admin disponível)
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.deleteUser(id)
        .catch(err => console.warn('[Teams] Failed to delete Supabase Auth user:', err.message));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
