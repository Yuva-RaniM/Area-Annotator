import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

export class ServerAiInterpretationService {
  /**
   * Evaluates architectural context for a candidate room space.
   * Gemini provides semantic categorization and clean architectural tags.
   */
  static async analyzeSpace(currentName: string, nearbyText: string[], pageNumber: number) {
    if (!genAI) {
      // Graceful fallback when API key is not yet set
      return {
        suggestedName: currentName,
        category: 'Standard Enclosed Space',
        architecturalNotes: 'Gemini API key not configured on server. Provide GEMINI_API_KEY in .env for advanced AI categorization.',
        confidence: 'Medium'
      };
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert architectural plan reviewer.
Given a floor plan detected space with initial label: "${currentName}"
Nearby architectural text elements found in or near the boundary: ${JSON.stringify(nearbyText)}
Drawing Sheet: Page ${pageNumber}

Tasks:
1. Provide the most accurate standardized architectural room name (e.g. "Master Bedroom", "Kitchen & Dining", "Open Office", "Conference Room A", "Restroom").
2. Classify the architectural space category (e.g., "Residential: Living", "Commercial: Workplace", "Circulation", "Service/Utility").
3. Provide a brief 1-sentence architectural note.

Return strictly a JSON object with this format:
{
  "suggestedName": string,
  "category": string,
  "architecturalNotes": string,
  "confidence": "High" | "Medium" | "Low"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Extract JSON block
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        suggestedName: currentName,
        category: 'Architectural Space',
        architecturalNotes: text.substring(0, 150),
        confidence: 'Medium'
      };
    } catch (err: any) {
      console.warn('Gemini analysis error:', err.message);
      return {
        suggestedName: currentName,
        category: 'Architectural Space',
        architecturalNotes: 'AI analysis temporarily unavailable.',
        confidence: 'Low'
      };
    }
  }

  /**
   * Cleans fragmented OCR text (e.g., "B E D R O O M   1" -> "Bedroom 1")
   */
  static async cleanLabel(rawText: string) {
    if (!genAI) {
      return { cleanedLabel: rawText.replace(/\s+/g, ' ').trim() };
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are an architectural OCR cleanup engine.
Clean this fragmented floor plan label into a standard, clean title-cased architectural room name:
"${rawText}"

Return ONLY the cleaned string, nothing else.`;

      const result = await model.generateContent(prompt);
      const cleaned = result.response.text().trim();
      return { cleanedLabel: cleaned || rawText };
    } catch {
      return { cleanedLabel: rawText };
    }
  }
}
