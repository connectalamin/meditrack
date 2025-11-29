import prisma from '../config/database.js';

// Get purchase list logs for current user and linked accounts
export const getPurchaseListLogs = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    const userIds = [req.user.id];
    if (user?.linkedFamilyId) {
      userIds.push(user.linkedFamilyId);
    }

    const usersLinkedToMe = await prisma.user.findMany({
      where: { linkedFamilyId: req.user.id },
      select: { id: true }
    });

    usersLinkedToMe.forEach(u => {
      if (!userIds.includes(u.id)) {
        userIds.push(u.id);
      }
    });

    const logs = await prisma.purchaseListLog.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ logs });
  } catch (error) {
    next(error);
  }
};

// Create a new purchase list log entry
export const createPurchaseListLog = async (req, res, next) => {
  try {
    const { title, content, totalItems, totalQuantity, totalCost } = req.body;

    // Debug: check available Prisma models
    if (!prisma.purchaseListLog) {
      console.error('purchaseListLog model is missing on Prisma client. Available keys:', Object.keys(prisma));
      return res.status(500).json({ message: 'Purchase list log model not available on server' });
    }

    const log = await prisma.purchaseListLog.create({
      data: {
        userId: req.user.id,
        title,
        content,
        totalItems,
        totalQuantity,
        totalCost
      }
    });

    res.status(201).json({ log });
  } catch (error) {
    next(error);
  }
};


