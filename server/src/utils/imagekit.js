import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload file to ImageKit
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} folder - Folder path in ImageKit (optional)
 * @returns {Promise<{url: string, fileId: string}>}
 */
export const uploadToImageKit = async (fileBuffer, fileName, folder = 'reports') => {
  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: `/${folder}`,
      useUniqueFileName: false, // We're already generating unique names
    });

    return {
      url: result.url,
      fileId: result.fileId,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw new Error(`Failed to upload file to ImageKit: ${error.message}`);
  }
};

/**
 * Delete file from ImageKit
 * @param {string} fileId - ImageKit file ID
 * @returns {Promise<void>}
 */
export const deleteFromImageKit = async (fileId) => {
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error('ImageKit delete error:', error);
    // Don't throw - file might already be deleted
  }
};

/**
 * Extract file ID from ImageKit URL or filePath
 * @param {string} url - ImageKit URL or filePath
 * @returns {string|null} - File ID or null
 */
export const getFileIdFromUrl = async (url) => {
  if (!url || !url.includes('imagekit.io')) {
    return null;
  }
  
  try {
    // Extract file path from URL
    const urlObj = new URL(url);
    const filePath = urlObj.pathname;
    
    // List files in ImageKit to find the fileId
    const files = await imagekit.listFiles({
      path: filePath,
      limit: 1,
    });
    
    if (files && files.length > 0) {
      return files[0].fileId;
    }
  } catch (error) {
    console.error('Error extracting fileId from URL:', error);
  }
  
  return null;
};

export default imagekit;

