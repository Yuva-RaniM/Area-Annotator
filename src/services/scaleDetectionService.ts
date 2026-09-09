import { NormalizedPoint } from '../types/coordinate';
import { PageScaleInfo } from '../types/space';
import { TextElement } from '../types/pdf';
import { PdfTextService } from './pdfTextService';

export class ScaleDetectionService {
  /**
   * Attempts automatic scale detection from page text elements.
   */
  static detectScaleFromText(
    textElements: TextElement[],
    canvasDimensions: { width: number; height: number }
  ): PageScaleInfo | null {
    const detected = PdfTextService.detectPageScale(textElements);
    if (!detected) return null;

    // Standard 72 DPI PDF point conversion
    // If canvas scale is rendered at canvasDimensions.width / 595.28 (A4 width at 72 DPI)
    const scaleFactor = canvasDimensions.width / 595.28;
    const basePpm = detected.pixelsPerMeter || 28.35; // default 1:100 at 72 DPI
    const pixelsPerMeter = basePpm * scaleFactor;

    return {
      ratio: `Scale ${detected.ratio} (Auto-Detected)`,
      pixelsPerMeter,
      calibrated: true,
      referenceUnit: 'm'
    };
  }

  /**
   * Calibrates scale from two user-selected points and a known real-world distance.
   */
  static calibrateFromPoints(
    pointA: NormalizedPoint,
    pointB: NormalizedPoint,
    realDistance: number,
    unit: 'm' | 'ft' | 'mm',
    canvasWidth: number,
    canvasHeight: number
  ): PageScaleInfo {
    if (realDistance <= 0) {
      throw new Error('Real distance must be greater than zero.');
    }

    const pixelDx = (pointB.x - pointA.x) * canvasWidth;
    const pixelDy = (pointB.y - pointA.y) * canvasHeight;
    const pixelDistance = Math.hypot(pixelDx, pixelDy);

    if (pixelDistance < 5) {
      throw new Error('Selected points are too close together to establish a reliable scale.');
    }

    // Convert realDistance to meters for standard calculation
    let distanceInMeters = realDistance;
    if (unit === 'ft') {
      distanceInMeters = realDistance * 0.3048;
    } else if (unit === 'mm') {
      distanceInMeters = realDistance / 1000.0;
    }

    const pixelsPerMeter = pixelDistance / distanceInMeters;

    return {
      ratio: `1 : ${(1000 / (pixelsPerMeter / 28.35)).toFixed(0)} (Calibrated)`,
      pixelsPerMeter,
      calibrated: true,
      referenceDistance: realDistance,
      referenceUnit: unit,
      pointA,
      pointB
    };
  }
}
