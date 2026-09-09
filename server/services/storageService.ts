import fs from 'fs';
import path from 'path';

export interface ServerDrawing {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  pageCount: number;
  measurementCount: number;
  scales?: Record<number, any>;
  annotations: any[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'drawings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class ServerStorageService {
  private static readDatabase(): Record<string, ServerDrawing> {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), 'utf-8');
        return {};
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading drawings database:', err);
      return {};
    }
  }

  private static writeDatabase(data: Record<string, ServerDrawing>): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing drawings database:', err);
    }
  }

  static getDrawings(): ServerDrawing[] {
    const db = this.readDatabase();
    return Object.values(db).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  static getDrawingById(id: string): ServerDrawing | null {
    const db = this.readDatabase();
    return db[id] || null;
  }

  static saveDrawing(drawing: ServerDrawing): ServerDrawing {
    const db = this.readDatabase();
    const timestamp = new Date().toISOString();
    const existing = db[drawing.id];

    const saved: ServerDrawing = {
      ...drawing,
      createdAt: existing ? existing.createdAt : timestamp,
      updatedAt: timestamp,
      measurementCount: drawing.annotations ? drawing.annotations.length : 0
    };

    db[drawing.id] = saved;
    this.writeDatabase(db);
    return saved;
  }

  static deleteDrawing(id: string): boolean {
    const db = this.readDatabase();
    if (db[id]) {
      // If local uploaded file exists, delete it
      const fileUrl = db[id].fileUrl;
      if (fileUrl && fileUrl.startsWith('/uploads/')) {
        const filePath = path.resolve(process.cwd(), fileUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn('Could not delete file:', e);
          }
        }
      }
      delete db[id];
      this.writeDatabase(db);
      return true;
    }
    return false;
  }

  static addAnnotation(drawingId: string, annotation: any): any {
    const db = this.readDatabase();
    const drawing = db[drawingId];
    if (!drawing) throw new Error('Drawing not found');

    if (!drawing.annotations) drawing.annotations = [];
    drawing.annotations = drawing.annotations.filter(a => a.id !== annotation.id);
    drawing.annotations.push(annotation);
    drawing.measurementCount = drawing.annotations.length;
    drawing.updatedAt = new Date().toISOString();

    this.writeDatabase(db);
    return annotation;
  }

  static deleteAnnotation(drawingId: string, annotationId: string): boolean {
    const db = this.readDatabase();
    const drawing = db[drawingId];
    if (!drawing || !drawing.annotations) return false;

    drawing.annotations = drawing.annotations.filter(a => a.id !== annotationId);
    drawing.measurementCount = drawing.annotations.length;
    drawing.updatedAt = new Date().toISOString();

    this.writeDatabase(db);
    return true;
  }
}
