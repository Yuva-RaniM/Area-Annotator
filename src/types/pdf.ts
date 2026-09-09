import { NormalizedPoint, NormalizedBoundingBox } from './coordinate';
import { CandidateSpace, PageScaleInfo } from './space';

export interface TextElement {
  id: string;
  text: string;
  boundingBox: NormalizedBoundingBox;
  fontSize?: number;
  confidence?: number;
}

export interface VectorLine {
  id: string;
  p1: NormalizedPoint;
  p2: NormalizedPoint;
  strokeWidth?: number;
  isWallCandidate?: boolean;
}

export interface DimensionAnnotation {
  id: string;
  text: string;
  value: number;
  unit: string;
  boundingBox: NormalizedBoundingBox;
}

export interface PageSpatialModel {
  pageNumber: number;
  width: number;
  height: number;
  textElements: TextElement[];
  lines: VectorLine[];
  dimensions: DimensionAnnotation[];
  candidateSpaces: CandidateSpace[];
  scale: PageScaleInfo | null;
  analyzedAt: string;
  hasVectorData: boolean;
  hasScannedData: boolean;
}

export interface PdfDocumentInfo {
  filename: string;
  fileSize: number;
  pageCount: number;
  title?: string;
  author?: string;
  createdAt?: string;
}
