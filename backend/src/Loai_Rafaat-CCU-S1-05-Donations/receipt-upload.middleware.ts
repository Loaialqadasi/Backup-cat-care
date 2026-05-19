import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';

// Receipts go into uploads/receipts/ relative to the working directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'receipts');

// Create the folder on startup if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Magic byte signatures for the allowed file types.
// These are checked AFTER the file is saved to disk to prevent client-spoofed MIME types.
const MAGIC_BYTE_SIGNATURES: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
  'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF header (covers WebP)
  'application/pdf': Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
};

// Set of allowed MIME types for the initial client-provided check
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

// 5 MB cap — reasonable for a payment screenshot or PDF receipt
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Store uploads on disk with a random filename to prevent path guessing
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Random prefix + original extension — nobody can guess the stored name
    const randomName = crypto.randomBytes(18).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

// Reject anything that isn't a supported image or PDF before it even hits disk
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    // Cast to any because multer's types want Error | null, but we want our AppError hierarchy
    cb(new ValidationError('Only JPEG, PNG, WEBP, and PDF files are allowed') as any, false);
  }
};

export const receiptUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1, // one receipt per submission
  },
});

/**
 * Validates the actual file content using magic bytes (not the client-provided MIME type).
 * This prevents spoofing attacks where a malicious file is labeled as a safe type.
 * Returns the detected MIME type, or throws ValidationError if the file type is not allowed.
 */
export const validateFileMagicBytes = async (
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

    // No matching magic bytes found — reject the file
    throw new ValidationError(
      `File content does not match declared type "${declaredMimetype}". Only JPEG, PNG, WEBP, and PDF files are allowed.`
    );
  } finally {
    await fd.close();
  }
};

// Clean up a stored file — used when a donation record is deleted or if saving to DB fails
export const deleteUploadedFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Swallow errors here — the worst case is an orphaned file, not a crash
  }
};
