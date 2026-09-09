import { NormalizedPoint } from '../types/coordinate';
import { Space, CandidateSpace, PageScaleInfo, ConfidenceLevel, DetectionMethod, AreaSource } from '../types/space';
import { PageSpatialModel, TextElement } from '../types/pdf';
import { ContourExtractor } from '../utils/contour';
import { GeometryUtils } from '../utils/geometry';
import { CoordinateConverter } from '../utils/coordinates';
import { PdfTextService } from './pdfTextService';

export class SpaceDetectionService {
  private spatialModels: Map<number, PageSpatialModel> = new Map();
  private wallMaskCache: Map<number, { mask: Uint8Array; width: number; height: number }> = new Map();

  /**
   * Clears cached spatial models (when a new document is loaded).
   */
  clearCache() {
    this.spatialModels.clear();
    this.wallMaskCache.clear();
  }

  /**
   * Initializes or caches page spatial model and wall mask from rendered canvas.
   */
  async initializePageModel(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    textElements: TextElement[],
    scaleInfo: PageScaleInfo | null = null
  ): Promise<PageSpatialModel> {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable.');
    }

    // Capture image data at working resolution
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const wallMask = ContourExtractor.createWallMask(imgData, 2);

    this.wallMaskCache.set(pageNumber, {
      mask: wallMask,
      width: canvas.width,
      height: canvas.height
    });

    const model: PageSpatialModel = {
      pageNumber,
      width: canvas.width,
      height: canvas.height,
      textElements,
      lines: [],
      dimensions: [],
      candidateSpaces: [],
      scale: scaleInfo,
      analyzedAt: new Date().toISOString(),
      hasVectorData: true,
      hasScannedData: false
    };

    this.spatialModels.set(pageNumber, model);
    return model;
  }

  getSpatialModel(pageNumber: number): PageSpatialModel | undefined {
    return this.spatialModels.get(pageNumber);
  }

  /**
   * Core ONE CLICK algorithm:
   * Maps click point -> searches candidate spaces or extracts enclosed region from wall mask.
   */
  async detectSpaceAtPoint(
    clickNormalized: NormalizedPoint,
    pageNumber: number,
    canvas: HTMLCanvasElement,
    textElements: TextElement[],
    scaleInfo?: PageScaleInfo | null
  ): Promise<Space | null> {
    // 1. Ensure wall mask exists for this page
    let maskData = this.wallMaskCache.get(pageNumber);
    if (!maskData) {
      await this.initializePageModel(pageNumber, canvas, textElements, scaleInfo);
      maskData = this.wallMaskCache.get(pageNumber);
      if (!maskData) return null;
    }

    // 2. Check existing candidate spaces first
    const spatialModel = this.spatialModels.get(pageNumber);
    if (spatialModel && spatialModel.candidateSpaces.length > 0) {
      const containing = spatialModel.candidateSpaces.filter(cs =>
        GeometryUtils.pointInPolygon(clickNormalized, cs.polygon)
      );

      if (containing.length > 0) {
        // Select smallest appropriate enclosed region
        containing.sort((a, b) => {
          const areaA = GeometryUtils.calculateShoelaceArea(a.polygon);
          const areaB = GeometryUtils.calculateShoelaceArea(b.polygon);
          return areaA - areaB;
        });

        const selected = containing[0];
        return this.createSpaceFromCandidate(selected, pageNumber, textElements, scaleInfo);
      }
    }

    // 3. Perform real Computer Vision / Flood Fill contour extraction from click seed
    const regionResult = ContourExtractor.extractEnclosedRegion(
      maskData.mask,
      maskData.width,
      maskData.height,
      clickNormalized,
      0.005 // RDP epsilon
    );

    if (!regionResult || !regionResult.isEnclosed || regionResult.polygon.length < 3) {
      return null;
    }

    // 4. Verify seed point is inside the extracted polygon
    if (!GeometryUtils.pointInPolygon(clickNormalized, regionResult.polygon)) {
      // Re-check with slight point-in-polygon margin
      const centroid = GeometryUtils.calculateCentroid(regionResult.polygon);
      if (GeometryUtils.distance(clickNormalized, centroid) > 0.4) {
        return null;
      }
    }

    // 5. Look for room labels inside polygon
    const labelResult = PdfTextService.findRoomLabelInsidePolygon(
      regionResult.polygon,
      textElements
    );

    // 6. Look for explicit area text inside polygon
    const explicitArea = PdfTextService.findExplicitAreaInsidePolygon(
      regionResult.polygon,
      textElements
    );

    // 7. Calculate area
    const normalizedArea = GeometryUtils.calculateShoelaceArea(regionResult.polygon);
    const boundingBox = CoordinateConverter.computeBoundingBox(regionResult.polygon);

    let area: number | null = null;
    let areaUnit: 'm²' | 'sq ft' | 'mm²' | 'unavailable' = 'm²';
    let areaSource: AreaSource = 'unavailable';

    if (explicitArea) {
      area = explicitArea.areaValue;
      areaUnit = explicitArea.unit as any;
      areaSource = 'pdf-explicit';
    } else if (scaleInfo && scaleInfo.pixelsPerMeter > 0) {
      // Convert normalized area to real-world m² using scale
      // Normalized area * (canvasWidth * canvasHeight) / (pixelsPerMeter ^ 2)
      const canvasAreaPx = normalizedArea * (maskData.width * maskData.height);
      area = canvasAreaPx / (scaleInfo.pixelsPerMeter * scaleInfo.pixelsPerMeter);
      area = Math.round(area * 100) / 100;
      areaUnit = scaleInfo.referenceUnit === 'ft' ? 'sq ft' : 'm²';
      areaSource = 'geometry-derived';
    }

    // 8. Determine confidence
    let confidence: ConfidenceLevel = 'Low';
    if (areaSource === 'pdf-explicit' || (labelResult?.confidence === 'High' && area !== null)) {
      confidence = 'High';
    } else if (labelResult || area !== null) {
      confidence = 'Medium';
    } else {
      confidence = 'Low';
    }

    const roomName = labelResult?.label || 'Unnamed Space';
    const detectionMethod: DetectionMethod = 'computer-vision';

    const space: Space = {
      id: `space-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pageNumber,
      name: roomName,
      label: roomName,
      type: 'Room',
      polygon: regionResult.polygon,
      boundingBox,
      area,
      areaUnit,
      areaSource,
      confidence,
      detectionMethod,
      color: this.getRandomSpaceColor(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return space;
  }

  private createSpaceFromCandidate(
    candidate: CandidateSpace,
    pageNumber: number,
    textElements: TextElement[],
    scaleInfo?: PageScaleInfo | null
  ): Space {
    const explicitArea = PdfTextService.findExplicitAreaInsidePolygon(
      candidate.polygon,
      textElements
    );

    const normalizedArea = GeometryUtils.calculateShoelaceArea(candidate.polygon);
    let area: number | null = null;
    let areaUnit: 'm²' | 'sq ft' | 'mm²' | 'unavailable' = 'm²';
    let areaSource: AreaSource = 'unavailable';

    if (explicitArea) {
      area = explicitArea.areaValue;
      areaUnit = explicitArea.unit as any;
      areaSource = 'pdf-explicit';
    } else if (scaleInfo && scaleInfo.pixelsPerMeter > 0) {
      const maskData = this.wallMaskCache.get(pageNumber);
      if (maskData) {
        const canvasAreaPx = normalizedArea * (maskData.width * maskData.height);
        area = canvasAreaPx / (scaleInfo.pixelsPerMeter * scaleInfo.pixelsPerMeter);
        area = Math.round(area * 100) / 100;
        areaUnit = scaleInfo.referenceUnit === 'ft' ? 'sq ft' : 'm²';
        areaSource = 'geometry-derived';
      }
    }

    return {
      id: candidate.id,
      pageNumber,
      name: candidate.label || 'Enclosed Space',
      label: candidate.label,
      polygon: candidate.polygon,
      boundingBox: candidate.boundingBox,
      area,
      areaUnit,
      areaSource,
      confidence: candidate.confidence,
      detectionMethod: candidate.detectionMethod,
      color: this.getRandomSpaceColor(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private getRandomSpaceColor(): string {
    const palette = [
      '#0e8ce9', // blue
      '#10b981', // emerald
      '#8b5cf6', // violet
      '#f59e0b', // amber
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#14b8a6', // teal
      '#f97316'  // orange
    ];
    return palette[Math.floor(Math.random() * palette.length)];
  }
}

export const spaceDetectionService = new SpaceDetectionService();
