import { describe, it, expect } from 'vitest';
import { AreaCalculationService } from '../src/services/areaCalculationService';
import { NormalizedPoint } from '../src/types/coordinate';
import { PageScaleInfo } from '../src/types/space';

describe('AreaCalculationService', () => {
  // A square polygon taking 0.2 x 0.2 = 0.04 normalized area
  const squarePolygon: NormalizedPoint[] = [
    { x: 0.1, y: 0.1 },
    { x: 0.3, y: 0.1 },
    { x: 0.3, y: 0.3 },
    { x: 0.1, y: 0.3 }
  ];

  it('should return unavailable when no scale is calibrated', () => {
    const result = AreaCalculationService.recalculateSpaceArea(
      squarePolygon,
      null,
      { width: 1000, height: 1000 }
    );

    expect(result.area).toBeNull();
    expect(result.areaSource).toBe('unavailable');
  });

  it('should compute accurate square meter area when scale is calibrated', () => {
    // 1000 x 1000 canvas.
    // Normalized area = 0.04 -> canvasArea = 40,000 px^2.
    // Say pixelsPerMeter = 20 (meaning 20px = 1m).
    // real area = 40000 / (20^2) = 40000 / 400 = 100 m^2.
    const scale: PageScaleInfo = {
      ratio: '1:100 (Calibrated)',
      pixelsPerMeter: 20,
      calibrated: true,
      referenceUnit: 'm'
    };

    const result = AreaCalculationService.recalculateSpaceArea(
      squarePolygon,
      scale,
      { width: 1000, height: 1000 }
    );

    expect(result.area).toBe(100);
    expect(result.areaUnit).toBe('m²');
    expect(result.areaSource).toBe('geometry-derived');
    expect(result.confidence).toBe('High');
  });

  it('should convert square meters to square feet accurately', () => {
    // 100 m² ≈ 1076.39 sq ft
    const converted = AreaCalculationService.convertUnit(100, 'm²', 'sq ft');
    expect(converted).toBeCloseTo(1076.39, 1);
  });

  it('should convert square feet to square meters accurately', () => {
    // 1076.39 sq ft ≈ 100 m²
    const converted = AreaCalculationService.convertUnit(1076.39, 'sq ft', 'm²');
    expect(converted).toBeCloseTo(100, 1);
  });
});
