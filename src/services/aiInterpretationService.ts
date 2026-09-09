import { Space } from '../types/space';

export interface AiSpaceAnalysisResult {
  suggestedName?: string;
  category?: string;
  architecturalNotes?: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export class AiInterpretationService {
  /**
   * Sends candidate space info and nearby text to backend Gemini service for semantic enhancement.
   */
  static async analyzeSpaceContext(
    space: Space,
    nearbyText: string[]
  ): Promise<AiSpaceAnalysisResult | null> {
    try {
      const response = await fetch('/api/ai/analyze-space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentName: space.name,
          nearbyText,
          pageNumber: space.pageNumber
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('AI interpretation request failed or backend offline:', err);
      return null;
    }
  }

  /**
   * Cleans up fragmented architectural OCR labels via backend AI service.
   */
  static async cleanRoomLabel(rawText: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/clean-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });

      if (!response.ok) return rawText;

      const data = await response.json();
      return data.cleanedLabel || rawText;
    } catch {
      return rawText;
    }
  }
}
