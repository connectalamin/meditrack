import prisma from '../config/database.js';

export const getFamilyMembers = async (req, res, next) => {
  try {
    // Get user's linked family ID and basic info
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, displayName: true, linkedFamilyId: true }
    });

    // Ensure the current user always has a "Self" family member card
    if (user) {
      const existingSelf = await prisma.familyMember.findFirst({
        where: { userId: user.id, relation: 'Self' }
      });

      if (!existingSelf) {
        await prisma.familyMember.create({
          data: {
            userId: user.id,
            name: user.displayName || (user.email ? user.email.split('@')[0] : 'Me'),
            relation: 'Self',
            age: null,
            lastDoctorVisit: null
          }
        });
      }
    }

    // If there is a linked family account, ensure that account also has a "Self" card
    let linkedUser = null;
    if (user?.linkedFamilyId) {
      linkedUser = await prisma.user.findUnique({
        where: { id: user.linkedFamilyId },
        select: { id: true, email: true, displayName: true }
      });

      if (linkedUser) {
        const linkedSelf = await prisma.familyMember.findFirst({
          where: { userId: linkedUser.id, relation: 'Self' }
        });

        if (!linkedSelf) {
          await prisma.familyMember.create({
            data: {
              userId: linkedUser.id,
              name: linkedUser.displayName || (linkedUser.email ? linkedUser.email.split('@')[0] : 'Family Owner'),
              relation: 'Self',
              age: null,
              lastDoctorVisit: null
            }
          });
        }
      }
    }

    // Fetch family members from both current user and linked family
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

    const familyMembers = await prisma.familyMember.findMany({
      where: { userId: { in: userIds } },
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

    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    // Check if family member exists and get its owner
    const familyMember = await prisma.familyMember.findUnique({
      where: { id },
      select: { userId: true, relation: true }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Build list of accessible user IDs (current user + linked accounts)
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

    // Check if family member belongs to an accessible account
    if (!userIds.includes(familyMember.userId)) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Allow editing all accessible family members (own + linked)
    const updated = await prisma.familyMember.update({
      where: { id },
      data: req.body
    });

    res.json({ familyMember: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteFamilyMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    // Check if family member exists
    const familyMember = await prisma.familyMember.findUnique({
      where: { id },
      select: { userId: true, relation: true }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Build list of accessible user IDs (current user + linked accounts)
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

    // Check if family member belongs to an accessible account
    if (!userIds.includes(familyMember.userId)) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Prevent deletion of the main linked account's self card (the account owner)
    // Allow deletion of own self card and other members
    if (familyMember.relation === 'Self' && familyMember.userId === user?.linkedFamilyId) {
      return res.status(400).json({ 
        message: 'Cannot delete the main linked account member. This represents the account owner.' 
      });
    }

    // Allow deletion of all other members (own + linked account data members)
    await prisma.familyMember.delete({
      where: { id }
    });

    res.json({ message: 'Family member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

