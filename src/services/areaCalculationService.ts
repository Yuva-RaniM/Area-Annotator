import { NormalizedPoint } from '../types/coordinate';
import { Space, PageScaleInfo, AreaSource, AreaUnit } from '../types/space';
import { GeometryUtils } from '../utils/geometry';

export interface AreaCalculationResult {
  area: number | null;
  areaUnit: AreaUnit;
  areaSource: AreaSource;
  confidence: 'High' | 'Medium' | 'Low';
}

export class AreaCalculationService {
  /**
   * Recalculates the area of an existing space (e.g. after boundary vertex editing).
   */
  static recalculateSpaceArea(
    polygon: NormalizedPoint[],
    scaleInfo: PageScaleInfo | null,
    canvasDimensions: { width: number; height: number },
    originalSpace?: Partial<Space>
  ): AreaCalculationResult {
    if (!polygon || polygon.length < 3) {
      return {
        area: null,
        areaUnit: 'unavailable',
        areaSource: 'unavailable',
        confidence: 'Low'
      };
    }

    // If manual boundary editing modified the polygon, it is geometry-derived
    const normalizedArea = GeometryUtils.calculateShoelaceArea(polygon);

    if (scaleInfo && scaleInfo.pixelsPerMeter > 0 && canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      const canvasAreaPx = normalizedArea * (canvasDimensions.width * canvasDimensions.height);
      const rawArea = canvasAreaPx / (scaleInfo.pixelsPerMeter * scaleInfo.pixelsPerMeter);
      const roundedArea = Math.round(rawArea * 100) / 100;

      return {
        area: roundedArea,
        areaUnit: scaleInfo.referenceUnit === 'ft' ? 'sq ft' : 'm²',
        areaSource: 'geometry-derived',
        confidence: scaleInfo.calibrated ? 'High' : 'Medium'
      };
    }

    // If explicit area existed and boundary wasn't edited, keep it
    if (originalSpace?.areaSource === 'pdf-explicit' && originalSpace.area) {
      return {
        area: originalSpace.area,
        areaUnit: originalSpace.areaUnit || 'm²',
        areaSource: 'pdf-explicit',
        confidence: 'High'
      };
    }

    return {
      area: null,
      areaUnit: 'unavailable',
      areaSource: 'unavailable',
      confidence: 'Low'
    };
  }

  /**
   * Converts area between square meters and square feet.
   */
  static convertUnit(area: number, fromUnit: AreaUnit, toUnit: AreaUnit): number {
    if (fromUnit === toUnit) return area;
    if (fromUnit === 'm²' && toUnit === 'sq ft') {
      return Math.round(area * 10.7639 * 100) / 100;
    }
    if (fromUnit === 'sq ft' && toUnit === 'm²') {
      return Math.round((area / 10.7639) * 100) / 100;
    }
    return area;
  }
}
