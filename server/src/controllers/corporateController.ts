import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getCorporateData = async (req: Request, res: Response) => {
  try {
    const record = await prisma.corporateData.findUnique({
      where: { id: 1 }
    });

    if (record) {
      res.json(record.data);
    } else {
      res.status(404).json({ message: "No corporate data found" });
    }
  } catch (error) {
    console.error('Error fetching corporate data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCorporateData = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const record = await prisma.corporateData.upsert({
      where: { id: 1 },
      update: { data },
      create: {
        id: 1,
        data
      }
    });

    res.json(record.data);
  } catch (error) {
    console.error('Error updating corporate data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
