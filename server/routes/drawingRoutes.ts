import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ServerStorageService } from '../services/storageService';

const router = express.Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed.'));
    }
  }
});

// Upload PDF endpoint
router.post('/upload', upload.single('pdf'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No PDF file uploaded.' });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size
  });
});

// Get all drawings
router.get('/', (_req: Request, res: Response) => {
  const drawings = ServerStorageService.getDrawings();
  res.json(drawings);
});

// Get specific drawing
router.get('/:id', (req: Request, res: Response): void => {
  const drawing = ServerStorageService.getDrawingById(req.params.id);
  if (!drawing) {
    res.status(404).json({ error: 'Drawing not found' });
    return;
  }
  res.json(drawing);
});

// Save or update drawing
router.post('/', (req: Request, res: Response): void => {
  try {
    const drawing = req.body;
    if (!drawing.id || !drawing.name) {
      res.status(400).json({ error: 'Drawing ID and Name are required.' });
      return;
    }
    const saved = ServerStorageService.saveDrawing(drawing);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save drawing' });
  }
});

// Delete drawing
router.delete('/:id', (req: Request, res: Response): void => {
  const success = ServerStorageService.deleteDrawing(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Drawing not found' });
    return;
  }
  res.json({ success: true });
});

// Add annotation
router.post('/:id/annotations', (req: Request, res: Response): void => {
  try {
    const annotation = req.body;
    const added = ServerStorageService.addAnnotation(req.params.id, annotation);
    res.json(added);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete annotation
router.delete('/:id/annotations/:annotationId', (req: Request, res: Response): void => {
  const success = ServerStorageService.deleteAnnotation(req.params.id, req.params.annotationId);
  res.json({ success });
});

export default router;
