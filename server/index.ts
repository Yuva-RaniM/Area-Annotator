import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import drawingRoutes from './routes/drawingRoutes';
import aiRoutes from './routes/aiRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Body Parsers with generous limits for large CAD/PDF payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded PDFs
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/drawings', drawingRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    )
  });
});

// Serve frontend in production if built
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Area Annotator Server] Running on http://localhost:${PORT}`);
  console.log(`[Area Annotator Server] Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Unset (placeholder)'}`);
});

export default app;
