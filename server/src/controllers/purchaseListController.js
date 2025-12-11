import prisma from '../config/database.js';

export const getPurchaseListItems = async (req, res, next) => {
  try {
    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    // Fetch purchase list items from both current user and linked family
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

    const purchaseListItems = await prisma.purchaseListItem.findMany({
      where: { userId: { in: userIds } },
      include: {
        medication: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ purchaseListItems });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseListItem = async (req, res, next) => {
  try {
    const { medicationId, medicationName, quantity, price, discount, totalCost } = req.body;
    
    // If totalCost is provided from frontend (calculated based on packs), use it
    // Otherwise, calculate it (for backward compatibility)
    let finalTotalCost;
    if (totalCost !== undefined) {
      finalTotalCost = totalCost;
    } else {
      // Fallback: calculate based on quantity (old way, assumes quantity = packs)
      const subtotal = quantity * price;
      const discountAmount = discount ? subtotal * (discount / 100) : 0;
      finalTotalCost = subtotal - discountAmount;
    }

    const purchaseListItem = await prisma.purchaseListItem.create({
      data: {
        userId: req.user.id,
        medicationId: medicationId || null,
        medicationName,
        quantity,
        price,
        discount: discount || null,
        totalCost: finalTotalCost
      },
      include: {
        medication: true
      }
    });

    res.status(201).json({ purchaseListItem });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseListItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, price, medicationName, discount, totalCost } = req.body;

    // Calculate totalCost if quantity, price, or discount is updated
    const existingItem = await prisma.purchaseListItem.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Purchase list item not found' });
    }

    const finalQuantity = quantity !== undefined ? quantity : existingItem.quantity;
    const finalPrice = price !== undefined ? price : existingItem.price;
    const finalDiscount = discount !== undefined ? discount : existingItem.discount;
    
    // If totalCost is provided from frontend (calculated based on packs), use it
    // Otherwise, calculate it (for backward compatibility)
    let finalTotalCost;
    if (totalCost !== undefined) {
      finalTotalCost = totalCost;
    } else {
      // Fallback: calculate based on quantity (old way, assumes quantity = packs)
      const subtotal = finalQuantity * finalPrice;
      const discountAmount = finalDiscount ? subtotal * (finalDiscount / 100) : 0;
      finalTotalCost = subtotal - discountAmount;
    }

    const purchaseListItem = await prisma.purchaseListItem.update({
      where: {
        id
      },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(price !== undefined && { price }),
        ...(medicationName !== undefined && { medicationName }),
        ...(discount !== undefined && { discount: finalDiscount }),
        totalCost: finalTotalCost
      },
      include: {
        medication: true
      }
    });

    res.json({ purchaseListItem });
  } catch (error) {
    next(error);
  }
};

export const deletePurchaseListItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify item belongs to user before deleting
    const existingItem = await prisma.purchaseListItem.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Purchase list item not found' });
    }

    await prisma.purchaseListItem.delete({
      where: {
        id
      }
    });

    res.json({ message: 'Purchase list item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

