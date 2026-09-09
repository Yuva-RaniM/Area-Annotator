import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using ESM worker import
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

export interface RenderPageOptions {
  pageNumber: number;
  scale: number;
  canvas: HTMLCanvasElement;
  rotation?: number;
}

export interface RenderResult {
  renderedWidth: number;
  renderedHeight: number;
  originalWidth: number;
  originalHeight: number;
  viewport: pdfjsLib.PageViewport;
  imageData?: ImageData;
}

export class PdfService {
  private pdfDocument: pdfjsLib.PDFDocumentProxy | null = null;
  private pageCache: Map<number, pdfjsLib.PDFPageProxy> = new Map();

  /**
   * Loads a PDF document from an ArrayBuffer, Uint8Array, or URL.
   */
  async loadDocument(source: ArrayBuffer | Uint8Array | string): Promise<pdfjsLib.PDFDocumentProxy> {
    this.pageCache.clear();
    const loadingTask = pdfjsLib.getDocument(
      typeof source === 'string' ? { url: source } : { data: source }
    );
    this.pdfDocument = await loadingTask.promise;
    return this.pdfDocument;
  }

  getDocument(): pdfjsLib.PDFDocumentProxy | null {
    return this.pdfDocument;
  }

  getPageCount(): number {
    return this.pdfDocument ? this.pdfDocument.numPages : 0;
  }

  async getPage(pageNumber: number): Promise<pdfjsLib.PDFPageProxy> {
    if (!this.pdfDocument) {
      throw new Error('No PDF document loaded.');
    }
    if (this.pageCache.has(pageNumber)) {
      return this.pageCache.get(pageNumber)!;
    }
    const page = await this.pdfDocument.getPage(pageNumber);
    this.pageCache.set(pageNumber, page);
    return page;
  }

  /**
   * Renders a specific page to an HTML5 Canvas at the specified scale.
   */
  async renderPage(options: RenderPageOptions): Promise<RenderResult> {
    const page = await this.getPage(options.pageNumber);
    const rotation = options.rotation ?? page.rotate ?? 0;
    const viewport = page.getViewport({ scale: options.scale, rotation });

    const canvas = options.canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Unable to obtain 2D canvas context.');
    }

    const dpr = window.devicePixelRatio || 1;
    // Set actual canvas buffer size accounting for devicePixelRatio
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);

    // CSS display size
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      enableWebGL: false
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;
    ctx.restore();

    // Get unscaled original page dimensions
    const originalViewport = page.getViewport({ scale: 1.0, rotation: 0 });

    return {
      renderedWidth: viewport.width,
      renderedHeight: viewport.height,
      originalWidth: originalViewport.width,
      originalHeight: originalViewport.height,
      viewport
    };
  }

  /**
   * Captures raw ImageData from a rendered canvas for pixel-level computer vision analysis.
   */
  captureImageData(canvas: HTMLCanvasElement): ImageData | null {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  destroy() {
    this.pageCache.clear();
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }
  }
}

export const pdfService = new PdfService();
