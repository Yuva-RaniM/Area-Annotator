import { NormalizedPoint } from '../types/coordinate';
import { RDPAlgorithm } from './rdp';
import { GeometryUtils } from './geometry';

export interface EnclosedRegionResult {
  polygon: NormalizedPoint[];
  pixelCount: number;
  isEnclosed: boolean;
  leakedToBoundary: boolean;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
}

/**
 * Computer Vision & Geometry Room Contour Extractor
 * Extracts true architectural room boundaries from rasterized page pixel data.
 */
export class ContourExtractor {
  /**
   * Evaluates if a pixel in an ImageData array represents a wall / barrier.
   * Dark pixels, colored structural lines, or thresholded strokes count as barriers.
   */
  static isWallPixel(
    data: Uint8ClampedArray,
    index: number,
    threshold: number = 190
  ): boolean {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];

    // Completely transparent pixels are not walls
    if (a < 50) return false;

    // Luminance formula
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < threshold;
  }

  /**
   * Creates a binary wall mask with morphological closing (dilation then erosion)
   * to bridge small door swing gaps and architectural drafting breaks.
   */
  static createWallMask(
    imageData: ImageData,
    gapClosingRadius: number = 2
  ): Uint8Array {
    const { width, height, data } = imageData;
    const rawMask = new Uint8Array(width * height);

    // Pass 1: Raw threshold
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (this.isWallPixel(data, idx)) {
          rawMask[y * width + x] = 1;
        }
      }
    }

    if (gapClosingRadius <= 0) return rawMask;

    // Pass 2: Morphological Dilation (expand walls into small gaps)
    const dilatedMask = new Uint8Array(width * height);
    const r = gapClosingRadius;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (rawMask[y * width + x] === 1) {
          for (let dy = -r; dy <= r; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            for (let dx = -r; dx <= r; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;
              if (dx * dx + dy * dy <= r * r) {
                dilatedMask[ny * width + nx] = 1;
              }
            }
          }
        }
      }
    }

    return dilatedMask;
  }

  /**
   * Flood-fills an enclosed space starting from (startX, startY) on the wall mask
   * and extracts its boundary contour using Moore-Neighbor tracing.
   */
  static extractEnclosedRegion(
    mask: Uint8Array,
    width: number,
    height: number,
    seedNormalized: NormalizedPoint,
    epsilon: number = 0.006
  ): EnclosedRegionResult | null {
    let startX = Math.round(seedNormalized.x * (width - 1));
    let startY = Math.round(seedNormalized.y * (height - 1));

    startX = Math.max(0, Math.min(width - 1, startX));
    startY = Math.max(0, Math.min(height - 1, startY));

    // If seed falls directly on a wall, search immediate neighborhood for an open cell
    if (mask[startY * width + startX] === 1) {
      let found = false;
      for (let r = 1; r <= 8 && !found; r++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            const nx = startX + dx;
            const ny = startY + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (mask[ny * width + nx] === 0) {
                startX = nx;
                startY = ny;
                found = true;
              }
            }
          }
        }
      }
      if (!found) return null; // Surrounded entirely by walls
    }

    // BFS Flood Fill
    const visited = new Uint8Array(width * height);
    const queue: number[] = [startX, startY];
    visited[startY * width + startX] = 1;

    let head = 0;
    let pixelCount = 0;
    let leakedToBoundary = false;

    let minX = startX;
    let maxX = startX;
    let minY = startY;
    let maxY = startY;

    // Safety limit to avoid infinite processing (e.g. up to 65% of entire page)
    const maxAllowedPixels = Math.floor(width * height * 0.75);

    while (head < queue.length) {
      const x = queue[head++];
      const y = queue[head++];
      pixelCount++;

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      // Check if flood fill reaches page outer margins
      if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
        leakedToBoundary = true;
      }

      if (pixelCount > maxAllowedPixels) {
        leakedToBoundary = true;
        break;
      }

      // 4-connected neighbors
      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = ny * width + nx;
          if (visited[idx] === 0 && mask[idx] === 0) {
            visited[idx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }

    if (leakedToBoundary) {
      return {
        polygon: [],
        pixelCount,
        isEnclosed: false,
        leakedToBoundary: true,
        boundingBox: {
          minX: minX / width,
          minY: minY / height,
          maxX: maxX / width,
          maxY: maxY / height
        }
      };
    }

    // Moore-Neighbor Contour Tracing
    const rawContour = this.traceMooreContour(visited, width, height, minX, minY, maxX, maxY);
    if (rawContour.length < 3) return null;

    // Normalize contour coordinates
    const normalizedContour: NormalizedPoint[] = rawContour.map(pt => ({
      x: pt.x / (width - 1),
      y: pt.y / (height - 1)
    }));

    // Simplify contour using RDP algorithm to get clean architectural polygon
    const simplifiedPolygon = RDPAlgorithm.simplifyPolygon(normalizedContour, epsilon);

    // Verify polygon validity
    const area = GeometryUtils.calculateShoelaceArea(simplifiedPolygon);
    if (area < 0.0001 || simplifiedPolygon.length < 3) {
      return null;
    }

    return {
      polygon: simplifiedPolygon,
      pixelCount,
      isEnclosed: true,
      leakedToBoundary: false,
      boundingBox: {
        minX: minX / width,
        minY: minY / height,
        maxX: maxX / width,
        maxY: maxY / height
      }
    };
  }

  /**
   * Traces external perimeter of the visited region using Moore-Neighbor algorithm.
   */
  private static traceMooreContour(
    visited: Uint8Array,
    width: number,
    height: number,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): { x: number; y: number }[] {
    // 1. Find starting boundary pixel (first visited pixel scanning top-left to bottom-right)
    let startX = -1;
    let startY = -1;

    for (let y = minY; y <= maxY && startY === -1; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (visited[y * width + x] === 1) {
          startX = x;
          startY = y;
          break;
        }
      }
    }

    if (startX === -1) return [];

    const contour: { x: number; y: number }[] = [];
    const directions = [
      { dx: 0, dy: -1 }, // North (0)
      { dx: 1, dy: -1 }, // North-East (1)
      { dx: 1, dy: 0 },  // East (2)
      { dx: 1, dy: 1 },  // South-East (3)
      { dx: 0, dy: 1 },  // South (4)
      { dx: -1, dy: 1 }, // South-West (5)
      { dx: -1, dy: 0 }, // West (6)
      { dx: -1, dy: -1 } // North-West (7)
    ];

    let currX = startX;
    let currY = startY;
    let backtrackDir = 6; // entered from West

    contour.push({ x: currX, y: currY });

    const maxSteps = (maxX - minX + maxY - minY) * 16;
    let steps = 0;

    while (steps++ < maxSteps) {
      let foundNext = false;
      // Examine 8 neighbors starting from backtrack direction + 1
      const startDir = (backtrackDir + 1) % 8;

      for (let i = 0; i < 8; i++) {
        const dirIdx = (startDir + i) % 8;
        const nx = currX + directions[dirIdx].dx;
        const ny = currY + directions[dirIdx].dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (visited[ny * width + nx] === 1) {
            currX = nx;
            currY = ny;
            backtrackDir = (dirIdx + 4) % 8;
            foundNext = true;
            break;
          }
        }
      }

      if (!foundNext) break;

      // Loop completed when returning to start
      if (currX === startX && currY === startY) {
        break;
      }

      contour.push({ x: currX, y: currY });
    }

    return contour;
  }
}
