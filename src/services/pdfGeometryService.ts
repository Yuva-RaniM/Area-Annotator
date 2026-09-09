import { PDFPageProxy } from 'pdfjs-dist';
import { VectorLine } from '../types/pdf';
import { NormalizedPoint } from '../types/coordinate';

export class PdfGeometryService {
  /**
   * Extracts vector stroke and path line segments from PDF.js page operator list.
   */
  static async extractVectorLines(page: PDFPageProxy): Promise<VectorLine[]> {
    try {
      const opList = await page.getOperatorList();
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      const lines: VectorLine[] = [];
      let currentPoint: NormalizedPoint | null = null;
      let lineIdCounter = 0;

      // PDF.js OPS constants:
      // constructPath is 92, stroke is 83, fill is 77 in PDF.js OPS
      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];

        // Check for constructPath or drawing operations
        if (args && Array.isArray(args) && args.length >= 2) {
          const subOps = args[0];
          const subArgs = args[1];

          if (Array.isArray(subOps) && Array.isArray(subArgs)) {
            let argIdx = 0;
            for (let j = 0; j < subOps.length; j++) {
              const op = subOps[j];
              // moveTo
              if (op === 0) {
                const x = subArgs[argIdx++];
                const y = subArgs[argIdx++];
                currentPoint = {
                  x: Math.max(0, Math.min(1, x / pageWidth)),
                  y: Math.max(0, Math.min(1, (pageHeight - y) / pageHeight))
                };
              }
              // lineTo
              else if (op === 1) {
                const x = subArgs[argIdx++];
                const y = subArgs[argIdx++];
                const targetPoint: NormalizedPoint = {
                  x: Math.max(0, Math.min(1, x / pageWidth)),
                  y: Math.max(0, Math.min(1, (pageHeight - y) / pageHeight))
                };

                if (currentPoint) {
                  // Only consider lines with non-zero length
                  const dist = Math.hypot(targetPoint.x - currentPoint.x, targetPoint.y - currentPoint.y);
                  if (dist > 0.001) {
                    lines.push({
                      id: `line-${page.pageNumber}-${lineIdCounter++}`,
                      p1: currentPoint,
                      p2: targetPoint,
                      isWallCandidate: true
                    });
                  }
                }
                currentPoint = targetPoint;
              }
              // curveTo
              else if (op === 2) {
                argIdx += 6; // skip cubic Bezier coordinates
              }
              // closePath
              else if (op === 3) {
                // close path
              }
              // rect
              else if (op === 4) {
                const rx = subArgs[argIdx++];
                const ry = subArgs[argIdx++];
                const rw = subArgs[argIdx++];
                const rh = subArgs[argIdx++];

                const normX = Math.max(0, Math.min(1, rx / pageWidth));
                const normY = Math.max(0, Math.min(1, (pageHeight - (ry + rh)) / pageHeight));
                const normW = Math.max(0, Math.min(1, rw / pageWidth));
                const normH = Math.max(0, Math.min(1, rh / pageHeight));

                const p1 = { x: normX, y: normY };
                const p2 = { x: normX + normW, y: normY };
                const p3 = { x: normX + normW, y: normY + normH };
                const p4 = { x: normX, y: normY + normH };

                lines.push(
                  { id: `rect-${page.pageNumber}-${lineIdCounter++}`, p1, p2, isWallCandidate: true },
                  { id: `rect-${page.pageNumber}-${lineIdCounter++}`, p1: p2, p2: p3, isWallCandidate: true },
                  { id: `rect-${page.pageNumber}-${lineIdCounter++}`, p1: p3, p2: p4, isWallCandidate: true },
                  { id: `rect-${page.pageNumber}-${lineIdCounter++}`, p1: p4, p2: p1, isWallCandidate: true }
                );
              }
            }
          }
        }
      }

      return lines;
    } catch (err) {
      console.warn('Vector extraction failed, falling back to raster CV:', err);
      return [];
    }
  }
}
