import { describe, it, expect } from 'vitest';
import { ContourExtractor } from '../src/utils/contour';
import { GeometryUtils } from '../src/utils/geometry';

describe('ContourExtractor & Wall Mask Detection', () => {
  const width = 100;
  const height = 100;

  it('should extract a closed polygonal boundary from a fully enclosed wall box', () => {
    // Create synthetic 100x100 wall mask:
    // Walls along x=20, x=80, y=20, y=80
    const mask = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (
          ((x === 20 || x === 80) && y >= 20 && y <= 80) ||
          ((y === 20 || y === 80) && x >= 20 && x <= 80)
        ) {
          mask[y * width + x] = 1; // Wall
        }
      }
    }

    // Seed click inside room at (50, 50) -> normalized (0.5, 0.5)
    const seed = { x: 0.5, y: 0.5 };
    const result = ContourExtractor.extractEnclosedRegion(mask, width, height, seed, 0.01);

    expect(result).not.toBeNull();
    expect(result?.isEnclosed).toBe(true);
    expect(result?.leakedToBoundary).toBe(false);
    expect(result!.polygon.length).toBeGreaterThanOrEqual(4);

    // Verify seed is inside the detected polygon
    expect(GeometryUtils.pointInPolygon(seed, result!.polygon)).toBe(true);

    // Verify approximate coordinates (near 0.2 and 0.8)
    const bbox = result!.boundingBox;
    expect(bbox.minX).toBeCloseTo(0.2, 1);
    expect(bbox.maxX).toBeCloseTo(0.8, 1);
    expect(bbox.minY).toBeCloseTo(0.2, 1);
    expect(bbox.maxY).toBeCloseTo(0.8, 1);
  });

  it('should detect un-enclosed space when no walls contain the seed point', () => {
    // Blank mask with no walls
    const emptyMask = new Uint8Array(width * height);
    const seed = { x: 0.5, y: 0.5 };

    const result = ContourExtractor.extractEnclosedRegion(emptyMask, width, height, seed);

    expect(result).not.toBeNull();
    expect(result?.isEnclosed).toBe(false);
    expect(result?.leakedToBoundary).toBe(true);
    expect(result?.polygon.length).toBe(0);
  });
});
