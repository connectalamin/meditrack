import prisma from '../config/database.js';

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user.id },
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

