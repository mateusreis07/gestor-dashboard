import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

// Listar todos os times
export const listTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.user.findMany({
      where: { role: 'TEAM' },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    res.json(teams);
  } catch (error) {
    console.error('List teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Criar um novo time
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está em uso' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const team = await prisma.user.create({
      data: { name, email, password: hashed, role: 'TEAM' },
      select: { id: true, name: true, email: true, createdAt: true }
    });

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
    const { name, email, password } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      const conflict = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (conflict) return res.status(400).json({ error: 'E-mail já em uso' });
      updateData.email = email;
    }
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const team = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true }
    });

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

    res.json({ success: true });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
