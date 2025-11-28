import prisma from '../config/database.js';

export const getAppointments = async (req, res, next) => {
  try {
    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    // Fetch appointments from both current user and linked family
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

    const appointments = await prisma.appointment.findMany({
      where: { userId: { in: userIds } },
      orderBy: { date: 'asc' }
    });

    res.json({ appointments });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });

    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.update({
      where: {
        id,
        userId: req.user.id
      },
      data: req.body
    });

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.appointment.delete({
      where: {
        id,
        userId: req.user.id
      }
    });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

