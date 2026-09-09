import { NormalizedPoint, NormalizedBoundingBox } from './coordinate';

export type AreaSource =
  | 'pdf-explicit'
  | 'dimension-derived'
  | 'geometry-derived'
  | 'ocr-derived'
  | 'ai-assisted'
  | 'unavailable';

export type DetectionMethod =
  | 'vector'
  | 'ocr'
  | 'computer-vision'
  | 'ai-assisted'
  | 'hybrid'
  | 'manual';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type AreaUnit = 'm²' | 'sq ft' | 'mm²' | 'unavailable';

/**
 * Candidate space detected by the geometry / CV / vector pipeline
 */
export interface CandidateSpace {
  id: string;
  polygon: NormalizedPoint[];
  boundingBox: NormalizedBoundingBox;
  nearbyText?: string[];
  label?: string;
  confidence: ConfidenceLevel;
  detectionMethod: DetectionMethod;
  pixelArea?: number;
}

/**
 * Persisted measurement / annotated space
 */
export interface Space {
  id: string;
  pageNumber: number;
  name: string;
  label?: string;
  type?: string;
  polygon: NormalizedPoint[];
  boundingBox: NormalizedBoundingBox;
  area: number | null;
  areaUnit: AreaUnit;
  areaSource: AreaSource;
  confidence: ConfidenceLevel;
  scale?: PageScaleInfo;
  detectionMethod: DetectionMethod;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Page scale calibration information
 */
export interface PageScaleInfo {
  ratio: string;             // e.g. "1:100", "Custom Calibrated"
  pixelsPerMeter: number;    // normalized pixels / meter
  calibrated: boolean;
  referenceDistance?: number;// Real distance entered (e.g., 5.0)
  referenceUnit?: 'm' | 'ft' | 'mm';
  pointA?: NormalizedPoint;
  pointB?: NormalizedPoint;
}
