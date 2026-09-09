/**
 * Point in normalized page coordinates [0, 1].
 * x = pdfX / pageWidth
 * y = pdfY / pageHeight
 */
export interface NormalizedPoint {
  x: number;
  y: number;
}

/**
 * Point in screen / rendered canvas pixel coordinates.
 */
export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Point in unscaled PDF points (72 DPI).
 */
export interface PdfPoint {
  x: number;
  y: number;
}

/**
 * 2D Bounding Box in normalized coordinates [0, 1].
 */
export interface NormalizedBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Viewport transformation state.
 */
export interface ViewportTransform {
  scale: number;          // Zoom factor (e.g., 1.0, 1.5, 2.0)
  panX: number;           // Pan offset X in pixels
  panY: number;           // Pan offset Y in pixels
  rotation: number;       // Page rotation in degrees (0, 90, 180, 270)
  renderedWidth: number;  // Current rendered page width on screen
  renderedHeight: number; // Current rendered page height on screen
  pageOriginalWidth: number;  // Base PDF page width in points
  pageOriginalHeight: number; // Base PDF page height in points
}
