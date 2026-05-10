import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Writable folder for multipart uploads (served at /uploads/*). */
export const uploadsDir = path.join(__dirname, '..', 'uploads');

export function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = ext && /^\.(jpe?g|png|webp|heic|gif)$/i.test(ext) ? ext : '.jpg';
    cb(null, `${crypto.randomUUID()}${safe}`);
  },
});

function fileFilter(_req, file, cb) {
  if (/^image\/(jpeg|jpg|png|webp|gif|heic)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, HEIC, or GIF images are allowed.'));
  }
}

export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

/** Public URL for a stored filename (uses PUBLIC_BASE_URL when set). */
export function publicUploadUrl(req, filename) {
  const base = String(process.env.PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
  if (base) return `${base}/uploads/${filename}`;
  const host = req.get('host') || 'localhost:3000';
  const proto = req.protocol === 'https' ? 'https' : 'http';
  return `${proto}://${host}/uploads/${filename}`;
}
