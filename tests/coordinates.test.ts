import { describe, it, expect } from 'vitest';
import { CoordinateConverter } from '../src/utils/coordinates';
import { NormalizedPoint } from '../src/types/coordinate';

describe('CoordinateConverter', () => {
  it('should correctly normalize client click coordinates within canvas bounds', () => {
    const canvasRect = {
      left: 100,
      top: 50,
      width: 800,
      height: 600,
      right: 900,
      bottom: 650,
      x: 100,
      y: 50,
      toJSON: () => {}
    } as DOMRect;

    // Click at center of canvas
    const clientX = 500; // 100 + 400 = half of 800
    const clientY = 350; // 50 + 300 = half of 600

    const normalized = CoordinateConverter.clientToNormalized(clientX, clientY, canvasRect);

    expect(normalized.x).toBeCloseTo(0.5, 4);
    expect(normalized.y).toBeCloseTo(0.5, 4);
  });

  it('should clamp client coordinates outside canvas bounds to [0, 1]', () => {
    const canvasRect = {
      left: 100,
      top: 50,
      width: 500,
      height: 500,
      right: 600,
      bottom: 550,
      x: 100,
      y: 50,
      toJSON: () => {}
    } as DOMRect;

    const negativeClick = CoordinateConverter.clientToNormalized(50, 20, canvasRect);
    expect(negativeClick.x).toBe(0);
    expect(negativeClick.y).toBe(0);

    const excessiveClick = CoordinateConverter.clientToNormalized(700, 800, canvasRect);
    expect(excessiveClick.x).toBe(1);
    expect(excessiveClick.y).toBe(1);
  });

  it('should convert normalized coordinates to screen pixel coordinates accurately at any zoom', () => {
    const normalized: NormalizedPoint = { x: 0.25, y: 0.75 };
    
    // Zoom 1: 1000 x 800
    const screen1 = CoordinateConverter.normalizedToScreen(normalized, 1000, 800);
    expect(screen1.x).toBe(250);
    expect(screen1.y).toBe(600);

    // Zoom 2: 2000 x 1600
    const screen2 = CoordinateConverter.normalizedToScreen(normalized, 2000, 1600);
    expect(screen2.x).toBe(500);
    expect(screen2.y).toBe(1200);
  });

  it('should be a lossless round-trip between normalized and screen coordinates', () => {
    const originalNorm: NormalizedPoint = { x: 0.3456, y: 0.7891 };
    const width = 1420;
    const height = 980;

    const screen = CoordinateConverter.normalizedToScreen(originalNorm, width, height);
    const restoredNorm = CoordinateConverter.screenToNormalized(screen, width, height);

    expect(restoredNorm.x).toBeCloseTo(originalNorm.x, 5);
    expect(restoredNorm.y).toBeCloseTo(originalNorm.y, 5);
  });

  it('should compute the correct normalized bounding box for a set of points', () => {
    const polygon: NormalizedPoint[] = [
      { x: 0.1, y: 0.2 },
      { x: 0.5, y: 0.2 },
      { x: 0.5, y: 0.8 },
      { x: 0.1, y: 0.8 }
    ];

    const bbox = CoordinateConverter.computeBoundingBox(polygon);

    expect(bbox.minX).toBe(0.1);
    expect(bbox.minY).toBe(0.2);
    expect(bbox.maxX).toBe(0.5);
    expect(bbox.maxY).toBe(0.8);
    expect(bbox.width).toBeCloseTo(0.4, 5);
    expect(bbox.height).toBeCloseTo(0.6, 5);
  });
});
