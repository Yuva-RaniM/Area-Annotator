import { AreaSource, ConfidenceLevel, DetectionMethod, AreaUnit } from '../types/space';

export class Formatters {
  /**
   * Formats numeric area with appropriate unit.
   */
  static formatArea(area: number | null | undefined, unit: AreaUnit = 'm²'): string {
    if (area === null || area === undefined || isNaN(area) || area <= 0) {
      return 'Area unavailable';
    }
    return `${area.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
  }

  /**
   * Formats detection method for human-readable display.
   */
  static formatDetectionMethod(method: DetectionMethod): string {
    switch (method) {
      case 'vector':
        return 'Vector Geometry';
      case 'computer-vision':
        return 'Computer Vision';
      case 'ocr':
        return 'OCR Detection';
      case 'ai-assisted':
        return 'AI-Assisted';
      case 'hybrid':
        return 'Hybrid (CV + Vector)';
      case 'manual':
        return 'Manual Boundary';
      default:
        return method;
    }
  }

  /**
   * Formats area source for display.
   */
  static formatAreaSource(source: AreaSource): string {
    switch (source) {
      case 'pdf-explicit':
        return 'PDF Explicit Text';
      case 'dimension-derived':
        return 'Dimension-Derived';
      case 'geometry-derived':
        return 'Geometry + Scale';
      case 'ocr-derived':
        return 'OCR-Derived';
      case 'ai-assisted':
        return 'AI-Assisted';
      case 'unavailable':
      default:
        return 'Unavailable';
    }
  }

  /**
   * Tailwind classes for confidence level.
   */
  static getConfidenceBadgeClass(confidence: ConfidenceLevel): string {
    switch (confidence) {
      case 'High':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Low':
      default:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  }

  /**
   * Format file size (e.g. "2.4 MB")
   */
  static formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Format date timestamp
   */
  static formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }
}
