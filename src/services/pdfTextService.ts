import { PDFPageProxy } from 'pdfjs-dist';
import { TextElement, DimensionAnnotation } from '../types/pdf';
import { NormalizedPoint } from '../types/coordinate';
import { GeometryUtils } from '../utils/geometry';

export class PdfTextService {
  /**
   * Common architectural room keywords for room label recognition
   */
  private static readonly ROOM_KEYWORDS = [
    'BEDROOM', 'BED', 'MASTER BEDROOM', 'GUEST BEDROOM', 'KITCHEN', 'LIVING',
    'LIVING ROOM', 'DINING', 'DINING ROOM', 'BATHROOM', 'BATH', 'TOILET', 'WC',
    'POWDER ROOM', 'ENSUITE', 'OFFICE', 'STUDY', 'BALCONY', 'TERRACE', 'PATIO',
    'HALL', 'HALLWAY', 'CORRIDOR', 'FOYER', 'ENTRY', 'ENTRANCE', 'LOBBY',
    'CLOSET', 'WALK IN CLOSET', 'WIC', 'WARDROBE', 'LAUNDRY', 'UTILITY',
    'STORE', 'STORAGE', 'PANTRY', 'GARAGE', 'CARPORT', 'BASEMENT', 'ATTIC',
    'RECEPTION', 'CONFERENCE', 'MEETING ROOM', 'BOARDROOM', 'BREAK ROOM',
    'RETAIL', 'SHOP', 'CLASSROOM', 'LAB', 'RESTROOM', 'SUITE', 'PORCH', 'DECK'
  ];

  /**
   * Regex to identify explicit area annotations printed directly on floor plans.
   * Examples: "24.50 m²", "145.2 sq ft", "32.4 sqm", "18.5 m2", "1200 SF"
   */
  private static readonly AREA_REGEX = /\b(\d+(?:[.,]\d+)?)\s*(m²|sqm|sq\s*\.?\s*m|sq\s*\.?\s*ft|sqft|m2|sf|s\.f\.)\b/i;

  /**
   * Regex to identify architectural scale markers printed on drawings.
   * Examples: "1:100", "1:50", "1:200", "1/4\" = 1'-0\"", "1/8\" = 1'-0\""
   */
  private static readonly SCALE_REGEX = /(?:SCALE\s*[:=]?\s*)?(1\s*:\s*\d{2,4}|1\/[248]"\s*=\s*1'[-\s]*0")/i;

  /**
   * Extracts and normalizes all text elements from a PDF page.
   */
  static async extractPageText(page: PDFPageProxy): Promise<TextElement[]> {
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    const elements: TextElement[] = [];

    for (let i = 0; i < textContent.items.length; i++) {
      const item = textContent.items[i] as any;
      if (!item.str || item.str.trim() === '') continue;

      const tx = item.transform[4];
      const ty = item.transform[5];
      const itemWidth = item.width || (item.str.length * 6);
      const itemHeight = item.height || Math.abs(item.transform[3]) || 10;

      // In PDF coordinate space, origin (0, 0) is at bottom-left
      // Convert to normalized coordinates where (0, 0) is at top-left
      const minX = Math.max(0, Math.min(1, tx / pageWidth));
      const minY = Math.max(0, Math.min(1, (pageHeight - (ty + itemHeight)) / pageHeight));
      const width = Math.max(0, Math.min(1, itemWidth / pageWidth));
      const height = Math.max(0, Math.min(1, itemHeight / pageHeight));

      elements.push({
        id: `text-${page.pageNumber}-${i}`,
        text: item.str.trim(),
        fontSize: item.height || 10,
        boundingBox: {
          minX,
          minY,
          maxX: Math.min(1, minX + width),
          maxY: Math.min(1, minY + height),
          width,
          height
        }
      });
    }

    return elements;
  }

  /**
   * Scans page text elements to find room labels enclosed within a space polygon.
   */
  static findRoomLabelInsidePolygon(
    polygon: NormalizedPoint[],
    textElements: TextElement[]
  ): { label: string; confidence: 'High' | 'Medium' | 'Low' } | null {
    const candidates: { text: string; isKeyword: boolean; score: number }[] = [];

    for (const elem of textElements) {
      // Calculate text center point
      const center: NormalizedPoint = {
        x: (elem.boundingBox.minX + elem.boundingBox.maxX) / 2,
        y: (elem.boundingBox.minY + elem.boundingBox.maxY) / 2
      };

      if (GeometryUtils.pointInPolygon(center, polygon)) {
        const upper = elem.text.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
        // Ignore pure numeric dimensions or area strings
        if (this.AREA_REGEX.test(elem.text) || /^\d+(?:\.\d+)?$/.test(elem.text)) {
          continue;
        }

        const isKeyword = this.ROOM_KEYWORDS.some(kw => upper.includes(kw));
        let score = isKeyword ? 100 : 20;

        // Longer architectural names get slightly higher rank
        if (elem.text.length >= 3 && elem.text.length <= 30) {
          score += 10;
        }

        candidates.push({
          text: elem.text,
          isKeyword,
          score
        });
      }
    }

    if (candidates.length === 0) return null;

    // Sort by highest score
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    return {
      label: best.text,
      confidence: best.isKeyword ? 'High' : 'Medium'
    };
  }

  /**
   * Scans page text elements inside a polygon for explicitly printed room areas.
   * e.g. "Living Room 28.5 m²"
   */
  static findExplicitAreaInsidePolygon(
    polygon: NormalizedPoint[],
    textElements: TextElement[]
  ): { areaValue: number; unit: string; rawText: string } | null {
    for (const elem of textElements) {
      const center: NormalizedPoint = {
        x: (elem.boundingBox.minX + elem.boundingBox.maxX) / 2,
        y: (elem.boundingBox.minY + elem.boundingBox.maxY) / 2
      };

      if (GeometryUtils.pointInPolygon(center, polygon)) {
        const match = elem.text.match(this.AREA_REGEX);
        if (match) {
          const rawNum = match[1].replace(',', '.');
          const value = parseFloat(rawNum);
          if (!isNaN(value) && value > 0) {
            const rawUnit = match[2].toLowerCase();
            const unit = rawUnit.includes('ft') || rawUnit.includes('sf') ? 'sq ft' : 'm²';
            return {
              areaValue: value,
              unit,
              rawText: match[0]
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Scans all page text elements for architectural drawing scale annotations.
   */
  static detectPageScale(textElements: TextElement[]): { ratio: string; pixelsPerMeter?: number } | null {
    for (const elem of textElements) {
      const match = elem.text.match(this.SCALE_REGEX);
      if (match) {
        const ratio = match[1].replace(/\s+/g, '');
        // Standard architectural ratios at 72 DPI
        // 1:100 means 1 cm on paper = 1 m in real life.
        // At 72 DPI, 1 inch = 2.54 cm -> 72 points / 2.54 cm = ~28.35 points per cm.
        // At 1:100, 1 meter = 1 cm = 28.35 points.
        let pixelsPerMeter: number | undefined;
        if (ratio === '1:100') {
          pixelsPerMeter = 28.35;
        } else if (ratio === '1:50') {
          pixelsPerMeter = 56.69;
        } else if (ratio === '1:200') {
          pixelsPerMeter = 14.17;
        } else if (ratio === '1:20') {
          pixelsPerMeter = 141.73;
        }

        return {
          ratio,
          pixelsPerMeter
        };
      }
    }
    return null;
  }
}
