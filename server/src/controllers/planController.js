import prisma from '../config/database.js';

export const getPlans = async (req, res, next) => {
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

    const plans = await prisma.plan.findMany({
      where: { familyMemberId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ plans });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req, res, next) => {
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

    const plan = await prisma.plan.create({
      data: {
        ...req.body,
        familyMemberId
      }
    });

    res.status(201).json({ plan });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req, res, next) => {
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

    const plan = await prisma.plan.update({
      where: {
        id,
        familyMemberId
      },
      data: req.body
    });

    res.json({ plan });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req, res, next) => {
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

    await prisma.plan.delete({
      where: {
        id,
        familyMemberId
      }
    });

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};

