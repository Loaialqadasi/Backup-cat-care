import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { catsController } from './cats.controller.js';
import { catIdParamSchema, createCatSchema, listCatsQuerySchema } from './cats.schemas.js';

export const catsRoutes = Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'cats');
fs.mkdirSync(uploadDir, { recursive: true });

// only accept these image types
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const mimeExtensionMap: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

// Magic byte signatures for image types
const MAGIC_BYTE_SIGNATURES: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
  'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF header (covers WebP)
};

/**
 * Validates the actual file content using magic bytes.
 * Returns the detected MIME type or throws ValidationError.
 */
const validateFileMagicBytes = async (
  filePath: string,
  declaredMimetype: string
): Promise<string> => {
  const fd = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(8);
    await fd.read(buffer, 0, 8, 0);

    for (const [mimeType, signature] of Object.entries(MAGIC_BYTE_SIGNATURES)) {
      if (buffer.subarray(0, signature.length).equals(signature)) {
        return mimeType;
      }
    }

    throw new ValidationError(
      `File content does not match declared type "${declaredMimetype}". Only JPEG, PNG, and WEBP images are allowed.`
    );
  } finally {
    await fd.close();
  }
};

// Middleware to validate magic bytes after multer saves the file
const verifyCatPhotoMagicBytes = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.file) {
      await validateFileMagicBytes(req.file.path, req.file.mimetype);
    }
    next();
  } catch (error) {
    // Clean up the uploaded file if validation fails
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// save uploads to disk with random filenames to prevent path traversal
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = mimeExtensionMap[file.mimetype];
    if (!extension) {
      return cb(new ValidationError('Only JPG, PNG, or WEBP images are allowed', { field: 'photo' }), '');
    }
    const randomId = crypto.randomBytes(6).toString('hex');
    const filename = `cat-${Date.now()}-${randomId}${extension}`;
    cb(null, filename);
  }
});

// double-check MIME type before saving
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new ValidationError('Only JPG, PNG, or WEBP images are allowed', { field: 'photo' }));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// create a cat — any authenticated user (student, volunteer, admin) can create cat records
  // M-5: This is intentional — students should be able to report campus cats they spot
catsRoutes.post(
  '/',
  authMiddleware,
  upload.single('photo'),
  verifyCatPhotoMagicBytes,
  validate({ body: createCatSchema }),
  catsController.create
);

// browse cats with search and filters
catsRoutes.get('/', validate({ query: listCatsQuerySchema }), catsController.list);

// view a single cat
catsRoutes.get('/:id', validate({ params: catIdParamSchema }), catsController.getById);
