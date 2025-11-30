import prisma from '../config/database.js';

export const getMedications = async (req, res, next) => {
  try {
    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    // Fetch medications from both current user and linked family
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

    const medications = await prisma.medication.findMany({
      where: { userId: { in: userIds } },
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

    // First check if the medication exists
    const medication = await prisma.medication.findUnique({
      where: { id }
    });

    if (!medication) {
      // Medication doesn't exist - return success (idempotent delete)
      return res.json({ message: 'Medication deleted successfully' });
    }

    // Check if the medication belongs to the user
    if (medication.userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this medication' 
      });
    }

    // Delete the medication
    await prisma.medication.delete({
      where: { id }
    });

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    next(error);
  }
};

