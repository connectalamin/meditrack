import prisma from '../config/database.js';

export const getMedications = async (req, res, next) => {
  try {
    const medications = await prisma.medication.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' }
    });

    res.json({ medications });
  } catch (error) {
    next(error);
  }
};

export const createMedication = async (req, res, next) => {
  try {
    const medication = await prisma.medication.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });

    res.status(201).json({ medication });
  } catch (error) {
    next(error);
  }
};

export const updateMedication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const medication = await prisma.medication.update({
      where: {
        id,
        userId: req.user.id
      },
      data: req.body
    });

    res.json({ medication });
  } catch (error) {
    next(error);
  }
};

export const deleteMedication = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.medication.delete({
      where: {
        id,
        userId: req.user.id
      }
    });

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    next(error);
  }
};

