import { describe, it, expect } from 'vitest';
import { RDPAlgorithm } from '../src/utils/rdp';
import { NormalizedPoint } from '../src/types/coordinate';
import { GeometryUtils } from '../src/utils/geometry';

describe('RDPAlgorithm', () => {
  it('should simplify straight edges with collinear intermediate points', () => {
    // A rectangle with multiple redundant collinear points along each side
    const noisyRectangle: NormalizedPoint[] = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.1001 },
      { x: 0.4, y: 0.0999 },
      { x: 0.8, y: 0.1 },
      { x: 0.8, y: 0.4 },
      { x: 0.8001, y: 0.6 },
      { x: 0.8, y: 0.9 },
      { x: 0.5, y: 0.9002 },
      { x: 0.1, y: 0.9 },
      { x: 0.0999, y: 0.5 }
    ];

    const simplified = RDPAlgorithm.simplifyPolygon(noisyRectangle, 0.01);

    expect(simplified.length).toBeLessThan(noisyRectangle.length);
    expect(simplified.length).toBeGreaterThanOrEqual(4);

    // Area should remain virtually identical
    const origArea = GeometryUtils.calculateShoelaceArea(noisyRectangle);
    const simpArea = GeometryUtils.calculateShoelaceArea(simplified);
    expect(simpArea).toBeCloseTo(origArea, 2);
  });
});
