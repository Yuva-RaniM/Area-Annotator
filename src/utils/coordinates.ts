import { NormalizedPoint, ScreenPoint, PdfPoint, NormalizedBoundingBox } from '../types/coordinate';

/**
 * Coordinate Conversion Service & Utility
 * Handles lossless conversions between:
 * 1. Normalized Page Coordinates [0, 1] (Storage format)
 * 2. Screen / Canvas Coordinates (Rendering & Mouse interaction)
 * 3. PDF Native Points (72 DPI reference)
 */
export class CoordinateConverter {
  /**
   * Converts a browser/mouse client event coordinate into normalized [0, 1] page coordinates.
   * Accounts for canvas bounding client rect, CSS scaling, and pan offsets.
   */
  static clientToNormalized(
    clientX: number,
    clientY: number,
    canvasRect: DOMRect
  ): NormalizedPoint {
    if (canvasRect.width <= 0 || canvasRect.height <= 0) {
      return { x: 0, y: 0 };
    }

    const rawX = (clientX - canvasRect.left) / canvasRect.width;
    const rawY = (clientY - canvasRect.top) / canvasRect.height;

    return {
      x: Math.max(0, Math.min(1, rawX)),
      y: Math.max(0, Math.min(1, rawY))
    };
  }

  /**
   * Converts a normalized point [0, 1] to screen/canvas pixel coordinates for rendering.
   */
  static normalizedToScreen(
    point: NormalizedPoint,
    renderedWidth: number,
    renderedHeight: number
  ): ScreenPoint {
    return {
      x: point.x * renderedWidth,
      y: point.y * renderedHeight
    };
  }

  /**
   * Converts an array of normalized points to screen coordinates.
   */
  static normalizedPolygonToScreen(
    polygon: NormalizedPoint[],
    renderedWidth: number,
    renderedHeight: number
  ): ScreenPoint[] {
    return polygon.map(pt => this.normalizedToScreen(pt, renderedWidth, renderedHeight));
  }

  /**
   * Converts screen/canvas coordinates to normalized coordinates [0, 1].
   */
  static screenToNormalized(
    point: ScreenPoint,
    renderedWidth: number,
    renderedHeight: number
  ): NormalizedPoint {
    if (renderedWidth <= 0 || renderedHeight <= 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: Math.max(0, Math.min(1, point.x / renderedWidth)),
      y: Math.max(0, Math.min(1, point.y / renderedHeight))
    };
  }

  /**
   * Converts normalized point [0, 1] to native PDF points (72 DPI).
   */
  static normalizedToPdf(
    point: NormalizedPoint,
    pdfWidth: number,
    pdfHeight: number
  ): PdfPoint {
    return {
      x: point.x * pdfWidth,
      y: point.y * pdfHeight
    };
  }

  /**
   * Converts native PDF points to normalized point [0, 1].
   */
  static pdfToNormalized(
    point: PdfPoint,
    pdfWidth: number,
    pdfHeight: number
  ): NormalizedPoint {
    if (pdfWidth <= 0 || pdfHeight <= 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: Math.max(0, Math.min(1, point.x / pdfWidth)),
      y: Math.max(0, Math.min(1, point.y / pdfHeight))
    };
  }

  /**
   * Computes normalized bounding box for an array of normalized points.
   */
  static computeBoundingBox(points: NormalizedPoint[]): NormalizedBoundingBox {
    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const pt of points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY)
    };
  }
}
