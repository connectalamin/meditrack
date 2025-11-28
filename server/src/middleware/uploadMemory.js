import multer from 'multer';

// Memory storage for OCR - keeps file in memory as buffer
const memoryStorage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed for OCR.'), false);
  }
};

const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export default uploadMemory;

