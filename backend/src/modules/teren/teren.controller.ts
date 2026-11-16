import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { getAuth } from '../../middleware/require-auth';

export const createTeren = async (req: Request, res: Response) => {
  try {
    // Preluam datele utilizatorului autentificat folosind functia din proiect
    const auth = getAuth(res);
    
    // In functie de cum e definit AuthContext la voi, ID-ul se afla fie in auth.user.id, fie in auth.userId
    const userId = (auth as any).user?.id || (auth as any).userId;

    const { nume, adresa, sector, numarJucatori } = req.body;

    const teren = await prisma.teren.create({
      data: {
        nume,
        adresa,
        sector,
        numarJucatori: Number(numarJucatori),
        adminId: userId,
      },
    });

    res.status(201).json(teren);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la crearea terenului' });
  }
};

export const editTeren = async (req: Request, res: Response) => {
  try {
    const auth = getAuth(res);
    const userId = (auth as any).user?.id || (auth as any).userId;
    const terenId = req.params.id as string;

    const existingTeren = await prisma.teren.findUnique({
      where: { id: terenId },
    });

    if (!existingTeren) {
      return res.status(404).json({ error: 'Terenul nu a fost gasit' });
    }

    // Doar proprietarul terenului il poate edita
    if (existingTeren.adminId !== userId) {
      return res.status(403).json({ error: 'Nu ai permisiunea de a edita acest teren' });
    }

    const { nume, adresa, sector, numarJucatori } = req.body;

    const updatedTeren = await prisma.teren.update({
      where: { id: terenId },
      data: {
        ...(nume && { nume }),
        ...(adresa && { adresa }),
        ...(sector && { sector }),
        ...(numarJucatori && { numarJucatori: Number(numarJucatori) }),
      },
    });

    res.json(updatedTeren);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la editarea terenului' });
  }
};