import prisma from '../config/database.js';

export const getReports = async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const report = await prisma.report.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });

    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.update({
      where: {
        id,
        userId: req.user.id
      },
      data: req.body
    });

    res.json({ report });
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.report.delete({
      where: {
        id,
        userId: req.user.id
      }
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

