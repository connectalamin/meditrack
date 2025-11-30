import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { optimizeFile } from '../utils/fileOptimizer.js';
import { uploadToImageKit } from '../utils/imagekit.js';

dotenv.config();

// Use memory storage to process files before saving
const memoryStorage = multer.memoryStorage();

// Get file size limit from .env or default to 10MB
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE 
  ? parseInt(process.env.MAX_FILE_SIZE, 10) 
  : 10 * 1024 * 1024; // Default: 10MB

// File filter
const fileFilter = (req, file, cb) => {
  // Allow PDF and image files
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
  }
};

const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE // Read from .env (5242880 = 5MB, or 10485760 = 10MB)
  }
});

// Middleware to optimize and upload files to ImageKit
export const optimizeUploadedFile = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const originalBuffer = req.file.buffer;
  const mimeType = req.file.mimetype;
  const originalName = req.file.originalname;

  try {
    // Optimize the file first (using Sharp)
    const optimized = await optimizeFile(originalBuffer, mimeType, originalName);

    // Generate optimized filename
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const baseName = path.basename(originalName, path.extname(originalName));
    const optimizedFilename = `${userId}_${timestamp}_${baseName}${optimized.extension}`;

    // Upload to ImageKit
    const imagekitResult = await uploadToImageKit(
      optimized.buffer,
      optimizedFilename,
      'reports'
    );

    // Update req.file with ImageKit information
    req.file.filename = optimizedFilename;
    req.file.url = imagekitResult.url; // ImageKit URL
    req.file.fileId = imagekitResult.fileId; // Store fileId for deletion
    req.file.filePath = imagekitResult.filePath;
    req.file.mimetype = optimized.mimeType;
    req.file.size = optimized.buffer.length;

    // Log optimization results
    const originalSize = originalBuffer.length;
    const optimizedSize = optimized.buffer.length;
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
    
    if (originalSize > optimizedSize) {
      console.log(`File optimized and uploaded: ${originalName} - ${(originalSize / 1024).toFixed(2)}KB → ${(optimizedSize / 1024).toFixed(2)}KB (${savings}% reduction) → ImageKit`);
    } else {
      console.log(`File uploaded to ImageKit: ${originalName} → ${imagekitResult.url}`);
    }

    next();
  } catch (error) {
    console.error('File optimization/upload error:', error);
    
    // If optimization/upload fails, try uploading original file
    try {
      const userId = req.user?.id || 'anonymous';
      const timestamp = Date.now();
      const baseName = path.basename(originalName, path.extname(originalName));
      const ext = path.extname(originalName);
      const filename = `${userId}_${timestamp}_${baseName}${ext}`;

      const imagekitResult = await uploadToImageKit(
        originalBuffer,
        filename,
        'reports'
      );

      req.file.filename = filename;
      req.file.url = imagekitResult.url;
      req.file.fileId = imagekitResult.fileId;
      req.file.filePath = imagekitResult.filePath;
      
      console.log(`Original file uploaded to ImageKit: ${filename}`);
      next();
    } catch (uploadError) {
      console.error('Failed to upload to ImageKit:', uploadError);
      return next(new Error('Failed to upload file. Please try again.'));
    }
  }
};

export default upload;

