import { NormalizedPoint } from '../types/coordinate';

/**
 * High-performance, robust computational geometry utilities.
 */
export class GeometryUtils {
  /**
   * Ray-casting algorithm to test if a point is strictly or on the boundary of a 2D polygon.
   * Works for both convex and concave polygons.
   */
  static pointInPolygon(point: NormalizedPoint, polygon: NormalizedPoint[]): boolean {
    if (!polygon || polygon.length < 3) return false;

    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      // Check if point is collinear with edge and within segment bounds
      const onSegment =
        Math.abs((yj - yi) * (point.x - xi) - (xj - xi) * (point.y - yi)) < 1e-9 &&
        point.x >= Math.min(xi, xj) - 1e-9 &&
        point.x <= Math.max(xi, xj) + 1e-9 &&
        point.y >= Math.min(yi, yj) - 1e-9 &&
        point.y <= Math.max(yi, yj) + 1e-9;

      if (onSegment) return true;

      // Ray-casting ray intersection test
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Calculates polygon area using the Shoelace formula (Gauss's area formula).
   * Returns positive area in coordinate units squared.
   */
  static calculateShoelaceArea(polygon: NormalizedPoint[]): number {
    if (!polygon || polygon.length < 3) return 0;

    let area = 0;
    const n = polygon.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].y;
      area -= polygon[j].x * polygon[i].y;
    }

    return Math.abs(area) / 2.0;
  }

  /**
   * Calculates the Euclidean distance between two points.
   */
  static distance(p1: NormalizedPoint, p2: NormalizedPoint): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Computes the polygon geometric centroid (center of mass).
   */
  static calculateCentroid(polygon: NormalizedPoint[]): NormalizedPoint {
    if (!polygon || polygon.length === 0) return { x: 0.5, y: 0.5 };
    if (polygon.length === 1) return { ...polygon[0] };
    if (polygon.length === 2) {
      return {
        x: (polygon[0].x + polygon[1].x) / 2,
        y: (polygon[0].y + polygon[1].y) / 2
      };
    }

    let cx = 0;
    let cy = 0;
    let signedArea = 0;
    const n = polygon.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const factor = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      signedArea += factor;
      cx += (polygon[i].x + polygon[j].x) * factor;
      cy += (polygon[i].y + polygon[j].y) * factor;
    }

    signedArea *= 0.5;

    if (Math.abs(signedArea) < 1e-9) {
      // Fallback to simple average if signedArea approaches zero
      let sumX = 0;
      let sumY = 0;
      for (const p of polygon) {
        sumX += p.x;
        sumY += p.y;
      }
      return { x: sumX / n, y: sumY / n };
    }

    cx = cx / (6 * signedArea);
    cy = cy / (6 * signedArea);

    return { x: cx, y: cy };
  }

  /**
   * Finds the closest vertex index in a polygon to a given point.
   */
  static findClosestVertexIndex(
    point: NormalizedPoint,
    polygon: NormalizedPoint[],
    thresholdNormalized: number = 0.03
  ): number {
    let closestIndex = -1;
    let minDistance = thresholdNormalized;

    for (let i = 0; i < polygon.length; i++) {
      const d = this.distance(point, polygon[i]);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  /**
   * Finds closest edge in polygon to insert a new vertex.
   */
  static findClosestEdge(
    point: NormalizedPoint,
    polygon: NormalizedPoint[],
    thresholdNormalized: number = 0.03
  ): { edgeIndex: number; insertPoint: NormalizedPoint } | null {
    if (polygon.length < 2) return null;

    let minDistance = thresholdNormalized;
    let bestResult: { edgeIndex: number; insertPoint: NormalizedPoint } | null = null;

    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const p1 = polygon[i];
      const p2 = polygon[j];

      // Project point onto line segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;

      if (lenSq === 0) continue;

      let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const dist = Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);

      if (dist < minDistance) {
        minDistance = dist;
        bestResult = {
          edgeIndex: j, // insert before index j
          insertPoint: { x: projX, y: projY }
        };
      }
    }

    return bestResult;
  }
}
