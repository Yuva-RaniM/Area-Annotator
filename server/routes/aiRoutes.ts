import express, { Request, Response } from 'express';
import { ServerAiInterpretationService } from '../services/aiInterpretationService';

const router = express.Router();

router.post('/analyze-space', async (req: Request, res: Response) => {
  try {
    const { currentName, nearbyText, pageNumber } = req.body;
    const result = await ServerAiInterpretationService.analyzeSpace(
      currentName || 'Unnamed Space',
      nearbyText || [],
      pageNumber || 1
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI analysis failed' });
  }
});

router.post('/clean-label', async (req: Request, res: Response) => {
  try {
    const { rawText } = req.body;
    const result = await ServerAiInterpretationService.cleanLabel(rawText || '');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI label cleanup failed' });
  }
});

export default router;
