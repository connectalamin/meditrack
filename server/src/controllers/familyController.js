import prisma from '../config/database.js';

export const getFamilyMembers = async (req, res, next) => {
  try {
    const familyMembers = await prisma.familyMember.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ familyMembers });
  } catch (error) {
    next(error);
  }
};

export const createFamilyMember = async (req, res, next) => {
  try {
    const familyMember = await prisma.familyMember.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });

    res.status(201).json({ familyMember });
  } catch (error) {
    next(error);
  }
};

export const updateFamilyMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const familyMember = await prisma.familyMember.update({
      where: {
        id,
        userId: req.user.id
      },
      data: req.body
    });

    res.json({ familyMember });
  } catch (error) {
    next(error);
  }
};

export const deleteFamilyMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.familyMember.delete({
      where: {
        id,
        userId: req.user.id
      }
    });

    res.json({ message: 'Family member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

