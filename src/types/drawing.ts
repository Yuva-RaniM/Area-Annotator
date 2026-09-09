import { Space, PageScaleInfo } from './space';

export interface DrawingMetadata {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  pageCount: number;
  measurementCount: number;
  scales?: Record<number, PageScaleInfo>; // pageNumber -> PageScaleInfo
  createdAt: string;
  updatedAt: string;
}

export interface Drawing extends DrawingMetadata {
  annotations: Space[];
}

export interface DrawingFilter {
  searchQuery: string;
  sortBy: 'updatedAt' | 'name' | 'measurementCount';
  sortOrder: 'asc' | 'desc';
}
