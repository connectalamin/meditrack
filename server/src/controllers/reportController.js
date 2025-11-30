import prisma from '../config/database.js';
import { deleteFromImageKit, getFileIdFromUrl } from '../utils/imagekit.js';

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
    
    // Get file URL from ImageKit if file was uploaded
    let fileUrl = null;
    if (req.file && req.file.url) {
      fileUrl = req.file.url; // ImageKit URL
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
    // Delete uploaded file from ImageKit if report creation fails
    if (req.file && req.file.fileId) {
      await deleteFromImageKit(req.file.fileId);
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
    if (req.file && req.file.url) {
      // Get existing report to delete old file from ImageKit
      const existingReport = await prisma.report.findFirst({
        where: { id, userId: req.user.id }
      });
      
      // Delete old file from ImageKit if it exists and is an ImageKit URL
      if (existingReport?.fileUrl && existingReport.fileUrl.includes('imagekit.io')) {
        try {
          const oldFileId = await getFileIdFromUrl(existingReport.fileUrl);
          if (oldFileId) {
            await deleteFromImageKit(oldFileId);
            console.log('Old file deleted from ImageKit:', existingReport.fileUrl);
          }
        } catch (error) {
          // Log error but don't fail the update - old file might already be deleted
          console.error('Error deleting old file from ImageKit:', error.message);
        }
      }
      
      updateData.fileUrl = req.file.url; // ImageKit URL
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
    // Delete uploaded file from ImageKit if update fails
    if (req.file && req.file.fileId) {
      await deleteFromImageKit(req.file.fileId);
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

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Delete associated file from ImageKit if it exists
    if (report.fileUrl && report.fileUrl.includes('imagekit.io')) {
      try {
        // Extract fileId from ImageKit URL
        const fileId = await getFileIdFromUrl(report.fileUrl);
        if (fileId) {
          await deleteFromImageKit(fileId);
          console.log('File deleted from ImageKit:', report.fileUrl);
        } else {
          console.warn('Could not extract fileId from ImageKit URL:', report.fileUrl);
        }
      } catch (error) {
        // Log error but don't fail the deletion - file might already be deleted
        console.error('Error deleting file from ImageKit:', error.message);
      }
    }

    // Delete report from database
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

