import multer from 'multer';
import { AppError } from '../errors/AppError';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

export const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(AppError.badRequest(`Invalid file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG`) as any);
    }
  },
}).single('document');
