import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Optimize image files to reduce size
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<Buffer>} - Optimized image buffer
 */
export const optimizeImage = async (fileBuffer, mimeType) => {
  try {
    let sharpInstance = sharp(fileBuffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Determine max dimensions (reduce large images)
    const maxWidth = 1920; // Max width for display
    const maxHeight = 1920; // Max height for display
    const quality = 85; // JPEG/WebP quality (good balance)
    
    // Resize if image is larger than max dimensions
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Convert and optimize based on format
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return await sharpInstance
        .jpeg({ 
          quality,
          progressive: true,
          mozjpeg: true // Better compression
        })
        .toBuffer();
    } else if (mimeType === 'image/png') {
      // Convert PNG to WebP for better compression (unless it has transparency)
      const hasAlpha = metadata.hasAlpha;
      
      if (!hasAlpha) {
        // No transparency - convert to WebP for better compression
        return await sharpInstance
          .webp({ quality })
          .toBuffer();
      } else {
        // Has transparency - keep as PNG but optimize
        return await sharpInstance
          .png({ 
            quality,
            compressionLevel: 9,
            adaptiveFiltering: true
          })
          .toBuffer();
      }
    } else if (mimeType === 'image/gif') {
      // Convert GIF to WebP for better compression
      return await sharpInstance
        .webp({ quality })
        .toBuffer();
    } else if (mimeType === 'image/webp') {
      // Already WebP - just optimize
      return await sharpInstance
        .webp({ quality })
        .toBuffer();
    }
    
    // Fallback: return original if format not handled
    return fileBuffer;
  } catch (error) {
    console.error('Image optimization error:', error);
    // Return original buffer if optimization fails
    return fileBuffer;
  }
};

/**
 * Get optimized file extension based on MIME type
 * @param {string} mimeType - Original MIME type
 * @param {boolean} hasAlpha - Whether image has alpha channel (for PNG)
 * @returns {string} - File extension
 */
export const getOptimizedExtension = (mimeType, hasAlpha = false) => {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return '.jpg';
  } else if (mimeType === 'image/png') {
    // Convert PNG to WebP if no transparency
    return hasAlpha ? '.png' : '.webp';
  } else if (mimeType === 'image/gif') {
    return '.webp';
  } else if (mimeType === 'image/webp') {
    return '.webp';
  }
  return null;
};

/**
 * Optimize file (image or PDF)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - MIME type
 * @param {string} originalPath - Original file path (for PDFs)
 * @returns {Promise<{buffer: Buffer, extension: string, mimeType: string}>}
 */
export const optimizeFile = async (fileBuffer, mimeType, originalPath = null) => {
  // Optimize images
  if (mimeType.startsWith('image/')) {
    const metadata = await sharp(fileBuffer).metadata().catch(() => null);
    const hasAlpha = metadata?.hasAlpha || false;
    
    const optimizedBuffer = await optimizeImage(fileBuffer, mimeType);
    const extension = getOptimizedExtension(mimeType, hasAlpha);
    const newMimeType = extension === '.webp' ? 'image/webp' : mimeType;
    
    return {
      buffer: optimizedBuffer,
      extension: extension || path.extname(originalPath || ''),
      mimeType: newMimeType
    };
  }
  
  // PDFs - return as-is for now (PDF optimization requires specialized tools)
  // In production, you might want to use a service or tool like ghostscript
  if (mimeType === 'application/pdf') {
    return {
      buffer: fileBuffer,
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  }
  
  // Unknown type - return as-is
  return {
    buffer: fileBuffer,
    extension: path.extname(originalPath || ''),
    mimeType
  };
};

