import { describe, it, expect } from 'vitest';
import { GeometryUtils } from '../src/utils/geometry';
import { NormalizedPoint } from '../src/types/coordinate';

describe('GeometryUtils', () => {
  // Unit square: (0,0) -> (1,0) -> (1,1) -> (0,1)
  const square: NormalizedPoint[] = [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.8, y: 0.8 },
    { x: 0.2, y: 0.8 }
  ];

  // L-shaped concave room polygon
  const concaveRoom: NormalizedPoint[] = [
    { x: 0.1, y: 0.1 },
    { x: 0.7, y: 0.1 },
    { x: 0.7, y: 0.4 },
    { x: 0.4, y: 0.4 },
    { x: 0.4, y: 0.8 },
    { x: 0.1, y: 0.8 }
  ];

  describe('pointInPolygon', () => {
    it('should return true for points strictly inside convex polygon', () => {
      expect(GeometryUtils.pointInPolygon({ x: 0.5, y: 0.5 }, square)).toBe(true);
      expect(GeometryUtils.pointInPolygon({ x: 0.3, y: 0.7 }, square)).toBe(true);
    });

    it('should return false for points strictly outside convex polygon', () => {
      expect(GeometryUtils.pointInPolygon({ x: 0.1, y: 0.5 }, square)).toBe(false);
      expect(GeometryUtils.pointInPolygon({ x: 0.9, y: 0.5 }, square)).toBe(false);
      expect(GeometryUtils.pointInPolygon({ x: 0.5, y: 0.1 }, square)).toBe(false);
      expect(GeometryUtils.pointInPolygon({ x: 0.5, y: 0.9 }, square)).toBe(false);
    });

    it('should correctly handle concave / L-shaped polygons', () => {
      // Inside top-left wing
      expect(GeometryUtils.pointInPolygon({ x: 0.2, y: 0.2 }, concaveRoom)).toBe(true);
      // Inside top-right wing
      expect(GeometryUtils.pointInPolygon({ x: 0.6, y: 0.2 }, concaveRoom)).toBe(true);
      // Inside bottom-left wing
      expect(GeometryUtils.pointInPolygon({ x: 0.2, y: 0.6 }, concaveRoom)).toBe(true);

      // In the cutout dent of the L-shape (outside)
      expect(GeometryUtils.pointInPolygon({ x: 0.6, y: 0.6 }, concaveRoom)).toBe(false);
      expect(GeometryUtils.pointInPolygon({ x: 0.5, y: 0.5 }, concaveRoom)).toBe(false);
    });

    it('should return true for points on the polygon edge', () => {
      expect(GeometryUtils.pointInPolygon({ x: 0.5, y: 0.2 }, square)).toBe(true);
      expect(GeometryUtils.pointInPolygon({ x: 0.8, y: 0.5 }, square)).toBe(true);
    });
  });

  describe('calculateShoelaceArea', () => {
    it('should compute exact area of a square', () => {
      // width = 0.6, height = 0.6 -> area = 0.36
      const area = GeometryUtils.calculateShoelaceArea(square);
      expect(area).toBeCloseTo(0.36, 5);
    });

    it('should compute exact area of an L-shaped room', () => {
      // (0.7-0.1)*(0.4-0.1) + (0.4-0.1)*(0.8-0.4) = 0.6*0.3 + 0.3*0.4 = 0.18 + 0.12 = 0.30
      const area = GeometryUtils.calculateShoelaceArea(concaveRoom);
      expect(area).toBeCloseTo(0.3, 5);
    });

    it('should return 0 for polygons with fewer than 3 vertices', () => {
      expect(GeometryUtils.calculateShoelaceArea([])).toBe(0);
      expect(GeometryUtils.calculateShoelaceArea([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(0);
    });
  });

  describe('calculateCentroid', () => {
    it('should return center of a symmetric polygon', () => {
      const centroid = GeometryUtils.calculateCentroid(square);
      expect(centroid.x).toBeCloseTo(0.5, 4);
      expect(centroid.y).toBeCloseTo(0.5, 4);
    });
  });

  describe('findClosestEdge', () => {
    it('should find closest edge to insert a new vertex', () => {
      const pointNearTopEdge = { x: 0.5, y: 0.21 };
      const edge = GeometryUtils.findClosestEdge(pointNearTopEdge, square, 0.05);

      expect(edge).not.toBeNull();
      expect(edge?.insertPoint.x).toBeCloseTo(0.5, 3);
      expect(edge?.insertPoint.y).toBeCloseTo(0.2, 3);
    });
  });
});
