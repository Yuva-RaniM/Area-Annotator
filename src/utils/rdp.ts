import { NormalizedPoint } from '../types/coordinate';

/**
 * Ramer-Douglas-Peucker (RDP) algorithm for polygonal contour simplification.
 * Reduces raw pixel-step contours to clean architectural polygon vertices.
 */
export class RDPAlgorithm {
  /**
   * Perpendicular distance from a point to a line segment defined by start and end.
   */
  private static perpendicularDistance(
    pt: NormalizedPoint,
    lineStart: NormalizedPoint,
    lineEnd: NormalizedPoint
  ): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const mag = Math.sqrt(dx * dx + dy * dy);

    if (mag === 0) {
      const ddx = pt.x - lineStart.x;
      const ddy = pt.y - lineStart.y;
      return Math.sqrt(ddx * ddx + ddy * ddy);
    }

    // Standard perpendicular distance: |dy*x - dx*y + x2*y1 - y2*x1| / mag
    return (
      Math.abs(dy * pt.x - dx * pt.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) /
      mag
    );
  }

  /**
   * Recursive RDP implementation on an open or closed line segment.
   */
  private static simplifySection(
    points: NormalizedPoint[],
    epsilon: number
  ): NormalizedPoint[] {
    if (points.length <= 2) return points;

    let maxDist = 0;
    let index = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
      const dist = this.perpendicularDistance(points[i], points[0], points[end]);
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    if (maxDist > epsilon) {
      const recResults1 = this.simplifySection(points.slice(0, index + 1), epsilon);
      const recResults2 = this.simplifySection(points.slice(index), epsilon);
      return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
    } else {
      return [points[0], points[end]];
    }
  }

  /**
   * Simplifies a closed polygon while preserving ring topology.
   * @param polygon Array of normalized vertices
   * @param epsilon Distance threshold (e.g. 0.003 - 0.01 in normalized coords)
   */
  static simplifyPolygon(
    polygon: NormalizedPoint[],
    epsilon: number = 0.005
  ): NormalizedPoint[] {
    if (!polygon || polygon.length <= 4) return polygon;

    // Find the point furthest from the first point to split the closed ring into two halves
    let maxDist = 0;
    let splitIdx = Math.floor(polygon.length / 2);

    for (let i = 1; i < polygon.length; i++) {
      const dx = polygon[i].x - polygon[0].x;
      const dy = polygon[i].y - polygon[0].y;
      const d = dx * dx + dy * dy;
      if (d > maxDist) {
        maxDist = d;
        splitIdx = i;
      }
    }

    const half1 = polygon.slice(0, splitIdx + 1);
    const half2 = polygon.slice(splitIdx).concat([polygon[0]]);

    const sim1 = this.simplifySection(half1, epsilon);
    const sim2 = this.simplifySection(half2, epsilon);

    const merged = sim1.slice(0, sim1.length - 1).concat(sim2.slice(0, sim2.length - 1));

    // Remove near-duplicate adjacent points
    const cleaned: NormalizedPoint[] = [];
    for (let i = 0; i < merged.length; i++) {
      const next = merged[(i + 1) % merged.length];
      const dist = Math.hypot(merged[i].x - next.x, merged[i].y - next.y);
      if (dist > 1e-4) {
        cleaned.push(merged[i]);
      }
    }

    return cleaned.length >= 3 ? cleaned : polygon;
  }
}
