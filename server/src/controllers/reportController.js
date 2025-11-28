import prisma from '../config/database.js';

export const getReports = async (req, res, next) => {
  try {
    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    // Fetch reports from both current user and linked family
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

    const reports = await prisma.report.findMany({
      where: { userId: { in: userIds } },
      orderBy: { date: 'desc' }
    });

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const { date, familyMemberId, ...rest } = req.body;
    
    // Get file URL if file was uploaded
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/reports/${req.file.filename}`;
    }
    
    const report = await prisma.report.create({
      data: {
        ...rest,
        date: date ? new Date(date) : new Date(),
        familyMemberId: familyMemberId || null,
        fileUrl,
        userId: req.user.id
      }
    });

    res.status(201).json({ report });
  } catch (error) {
    // Delete uploaded file if report creation fails
    if (req.file) {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname, '../../uploads/reports', req.file.filename);
      fs.unlink(filePath, () => {});
    }
    next(error);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, familyMemberId, ...rest } = req.body;
    
    const updateData = { ...rest };
    if (date) {
      updateData.date = new Date(date);
    }
    if (familyMemberId !== undefined) {
      updateData.familyMemberId = familyMemberId || null;
    }
    
    // Handle file upload
    if (req.file) {
      // Get existing report to delete old file
      const existingReport = await prisma.report.findFirst({
        where: { id, userId: req.user.id }
      });
      
      // Delete old file if it exists
      if (existingReport?.fileUrl) {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const oldFilePath = path.join(__dirname, '../..', existingReport.fileUrl);
        fs.unlink(oldFilePath, () => {}); // Ignore errors if file doesn't exist
      }
      
      updateData.fileUrl = `/uploads/reports/${req.file.filename}`;
    }

    const report = await prisma.report.update({
      where: {
        id,
        userId: req.user.id
      },
      data: updateData
    });

    res.json({ report });
  } catch (error) {
    // Delete uploaded file if update fails
    if (req.file) {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname, '../../uploads/reports', req.file.filename);
      fs.unlink(filePath, () => {});
    }
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get report to delete associated file
    const report = await prisma.report.findFirst({
      where: { id, userId: req.user.id }
    });

    await prisma.report.delete({
      where: {
        id,
        userId: req.user.id
      }
    });

    // Delete associated file if it exists
    if (report?.fileUrl) {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname, '../..', report.fileUrl);
      fs.unlink(filePath, () => {}); // Ignore errors if file doesn't exist
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

