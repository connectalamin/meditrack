import prisma from '../config/database.js';

export const getHealthData = async (req, res, next) => {
  try {
    const { familyMemberId } = req.params;

    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    // Check if family member belongs to current user or linked family
    const userIds = [req.user.id];
    if (user?.linkedFamilyId) {
      userIds.push(user.linkedFamilyId);
    }

    // Also check if any other user has linked to the current user (bidirectional)
    const usersLinkedToMe = await prisma.user.findMany({
      where: { linkedFamilyId: req.user.id },
      select: { id: true }
    });
    
    usersLinkedToMe.forEach(u => {
      if (!userIds.includes(u.id)) {
        userIds.push(u.id);
      }
    });

    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        userId: { in: userIds }
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

    // Verify family member belongs to current user (not linked family - read-only)
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

    // Verify family member belongs to current user (not linked family - read-only)
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

    // Verify family member belongs to current user (not linked family - read-only)
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

