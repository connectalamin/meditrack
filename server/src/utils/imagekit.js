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
    if (!fileId) {
      throw new Error('FileId is required for deletion');
    }
    const result = await imagekit.deleteFile(fileId);
    console.log('ImageKit delete result:', result);
  } catch (error) {
    console.error('ImageKit delete error:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      response: error.response
    });
    // Don't throw - file might already be deleted, but log for debugging
    throw error; // Re-throw so caller knows deletion failed
  }
};

/**
 * Extract file ID from ImageKit URL or filePath
 * @param {string} url - ImageKit URL or filePath
 * @returns {Promise<string|null>} - File ID or null
 */
export const getFileIdFromUrl = async (url) => {
  if (!url || !url.includes('imagekit.io')) {
    return null;
  }
  
  try {
    // Extract file path from URL
    const urlObj = new URL(url);
    let filePath = urlObj.pathname;
    
    // Remove leading slash if present
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    // Extract filename from path
    const fileName = filePath.split('/').pop();
    
    // Try multiple search strategies
    // Strategy 1: Search by exact filePath
    try {
      const filesByPath = await imagekit.listFiles({
        path: filePath,
        limit: 100,
      });
      
      if (filesByPath && filesByPath.length > 0) {
        // Find exact match by URL or filePath
        const exactMatch = filesByPath.find(file => 
          file.url === url || 
          file.filePath === filePath ||
          file.filePath === `/${filePath}`
        );
        if (exactMatch) {
          return exactMatch.fileId;
        }
        // If no exact match, return first result (might be the file)
        return filesByPath[0].fileId;
      }
    } catch (pathError) {
      console.log('Path search failed, trying name search:', pathError.message);
    }
    
    // Strategy 2: Search by filename
    if (fileName) {
      try {
        const filesByName = await imagekit.listFiles({
          name: fileName,
          limit: 100,
        });
        
        if (filesByName && filesByName.length > 0) {
          // Find exact match by URL or filePath
          const exactMatch = filesByName.find(file => 
            file.url === url || 
            file.filePath === filePath ||
            file.filePath === `/${filePath}` ||
            file.name === fileName
          );
          if (exactMatch) {
            return exactMatch.fileId;
          }
        }
      } catch (nameError) {
        console.log('Name search failed:', nameError.message);
      }
    }
    
    // Strategy 3: List all files and search (last resort - might be slow)
    try {
      const allFiles = await imagekit.listFiles({
        limit: 1000,
      });
      
      if (allFiles && allFiles.length > 0) {
        const exactMatch = allFiles.find(file => 
          file.url === url || 
          file.filePath === filePath ||
          file.filePath === `/${filePath}`
        );
        if (exactMatch) {
          return exactMatch.fileId;
        }
      }
    } catch (listError) {
      console.log('List all files failed:', listError.message);
    }
    
  } catch (error) {
    console.error('Error extracting fileId from URL:', error);
    console.error('URL was:', url);
  }
  
  return null;
};

export default imagekit;

