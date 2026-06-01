// ============================================================
// Routes: Documents (with Multer upload middleware)
// ============================================================
import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  listDocuments, getDocument, uploadDocument, uploadVersion,
  deleteDocument, restoreDocument, downloadDocument
} from '../controllers/document.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Multer storage
const uploadDir = join(__dirname, '../../../../uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const orgDir = join(uploadDir, req.organizationId || 'general');
    if (!existsSync(orgDir)) mkdirSync(orgDir, { recursive: true });
    cb(null, orgDir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `${uuidv4()}.${ext}`);
  }
});

const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,xlsx,pptx,txt,png,jpg,jpeg,csv').split(',');

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} not allowed. Permitted: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024 }
});

const router = Router();

// All document routes require authentication
router.use(authenticate);

router.get('/', listDocuments);
router.get('/:id', getDocument);
router.get('/:id/download', downloadDocument);
router.post('/', upload.single('file'), uploadDocument);
router.post('/:id/version', upload.single('file'), uploadVersion);
router.delete('/:id', deleteDocument);
router.patch('/:id/restore', restoreDocument);

export default router;
