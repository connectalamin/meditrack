import prisma from '../config/database.js';

export const getHealthData = async (req, res, next) => {
  try {
    const { familyMemberId } = req.params;

    // Verify family member belongs to user
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        userId: req.user.id
      }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    const healthData = await prisma.healthData.findMany({
      where: { familyMemberId },
      orderBy: { date: 'asc' }
    });

    res.json({ healthData });
  } catch (error) {
    next(error);
  }
};

export const createHealthData = async (req, res, next) => {
  try {
    const { familyMemberId } = req.params;

    // Verify family member belongs to user
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        userId: req.user.id
      }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    const healthData = await prisma.healthData.create({
      data: {
        ...req.body,
        familyMemberId
      }
    });

    res.status(201).json({ healthData });
  } catch (error) {
    next(error);
  }
};

export const updateHealthData = async (req, res, next) => {
  try {
    const { id, familyMemberId } = req.params;

    // Verify family member belongs to user
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        userId: req.user.id
      }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    const healthData = await prisma.healthData.update({
      where: {
        id,
        familyMemberId
      },
      data: req.body
    });

    res.json({ healthData });
  } catch (error) {
    next(error);
  }
};

export const deleteHealthData = async (req, res, next) => {
  try {
    const { id, familyMemberId } = req.params;

    // Verify family member belongs to user
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        userId: req.user.id
      }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    await prisma.healthData.delete({
      where: {
        id,
        familyMemberId
      }
    });

    res.json({ message: 'Health data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

