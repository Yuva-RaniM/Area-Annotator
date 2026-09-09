import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Space, PageScaleInfo } from '../../types/space';
import { NormalizedPoint } from '../../types/coordinate';
import { ActiveTool } from '../Toolbar/Toolbar';
import { CanvasOverlay } from './CanvasOverlay';
import { CoordinateConverter } from '../../utils/coordinates';
import { Crosshair, Loader2, Info, AlertTriangle } from 'lucide-react';

interface PdfViewerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  renderedDimensions: { width: number; height: number };
  activePage: number;
  scale: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  startPan: (clientX: number, clientY: number) => void;
  updatePan: (clientX: number, clientY: number) => void;
  endPan: () => void;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  spaces: Space[];
  selectedSpaceId: string | null;
  onSelectSpace: (spaceId: string | null) => void;
  isEditingBoundary: boolean;
  onUpdateSpacePolygon: (spaceId: string, polygon: NormalizedPoint[]) => void;
  onOneClickDetect: (clickNormalized: NormalizedPoint) => Promise<void>;
  // Calibration
  calibrationPointA: NormalizedPoint | null;
  calibrationPointB: NormalizedPoint | null;
  onCalibrationCanvasClick: (pt: NormalizedPoint) => void;
  calibrationStep: string;
  // Manual Draw Area
  onManualDrawFinish: (polygon: NormalizedPoint[]) => void;
  // Loading & status
  isProcessing: boolean;
  processingMessage: string;
  errorMessage: string | null;
  onClearError: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  canvasRef,
  renderedDimensions,
  activePage,
  scale,
  pan,
  isPanning,
  startPan,
  updatePan,
  endPan,
  activeTool,
  setActiveTool,
  spaces,
  selectedSpaceId,
  onSelectSpace,
  isEditingBoundary,
  onUpdateSpacePolygon,
  onOneClickDetect,
  calibrationPointA,
  calibrationPointB,
  onCalibrationCanvasClick,
  calibrationStep,
  onManualDrawFinish,
  isProcessing,
  processingMessage,
  errorMessage,
  onClearError
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [drawPoints, setDrawPoints] = useState<NormalizedPoint[]>([]);

  // Reset manual draw points when switching tools
  useEffect(() => {
    if (activeTool !== 'draw-area') {
      setDrawPoints([]);
    }
  }, [activeTool]);

  // Handle canvas container click
  const handleContainerClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || renderedDimensions.width <= 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const normalized = CoordinateConverter.clientToNormalized(e.clientX, e.clientY, rect);

    if (activeTool === 'one-click') {
      await onOneClickDetect(normalized);
    } else if (activeTool === 'calibrate') {
      onCalibrationCanvasClick(normalized);
    } else if (activeTool === 'draw-area') {
      setDrawPoints(prev => [...prev, normalized]);
    } else if (activeTool === 'select' && !isEditingBoundary) {
      onSelectSpace(null);
    }
  };

  const handleFinishDraw = () => {
    if (drawPoints.length >= 3) {
      onManualDrawFinish(drawPoints);
      setDrawPoints([]);
      setActiveTool('select');
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'pan' || e.button === 1) {
      startPan(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      updatePan(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      endPan();
    }
  };

  // Cursor style determination
  let cursorClass = 'cursor-default';
  if (isPanning) {
    cursorClass = 'cursor-grabbing';
  } else if (activeTool === 'pan') {
    cursorClass = 'cursor-grab';
  } else if (activeTool === 'one-click' || activeTool === 'draw-area' || activeTool === 'calibrate') {
    cursorClass = 'cursor-crosshair';
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full bg-slate-950 overflow-hidden select-none flex items-center justify-center ${cursorClass}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleContainerClick}
    >
      {/* BACKGROUND GRID PATTERN */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* TOP TOOL INSTRUCTION BANNER */}
      {activeTool === 'one-click' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-4 py-2 rounded-full shadow-xl backdrop-blur text-xs font-medium animate-pulse">
          <Crosshair className="w-4 h-4" />
          <span>Click inside a room or enclosed space to detect its boundary.</span>
        </div>
      )}

      {activeTool === 'calibrate' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-amber-950/90 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-full shadow-xl backdrop-blur text-xs font-medium">
          <Info className="w-4 h-4" />
          <span>
            {calibrationStep === 'pick_first' && 'Click the first point on a known dimension line.'}
            {calibrationStep === 'pick_second' && 'Click the second point on the dimension line.'}
            {calibrationStep === 'confirm_distance' && 'Enter real-world length in the calibration panel.'}
          </span>
        </div>
      )}

      {activeTool === 'draw-area' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-brand-950/90 text-brand-300 border border-brand-500/40 px-4 py-2 rounded-full shadow-xl backdrop-blur text-xs font-medium">
          <span>Click to place boundary vertices ({drawPoints.length} added).</span>
          {drawPoints.length >= 3 && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleFinishDraw();
              }}
              className="px-2.5 py-0.5 rounded bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow transition"
            >
              Finish Polygon
            </button>
          )}
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-rose-950/95 text-rose-200 border border-rose-500/50 px-4 py-2.5 rounded-lg shadow-xl backdrop-blur text-xs max-w-md">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={onClearError}
            className="ml-2 text-rose-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ASYNCHRONOUS PROCESSING LOADER */}
      {isProcessing && (
        <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-auto">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <span className="text-sm font-medium text-slate-200 font-sans">{processingMessage}</span>
        </div>
      )}

      {/* TRANSFORM CONTAINER (ZOOM & PAN) */}
      <div
        className="relative shadow-2xl transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          width: renderedDimensions.width ? `${renderedDimensions.width}px` : 'auto',
          height: renderedDimensions.height ? `${renderedDimensions.height}px` : 'auto'
        }}
      >
        {/* PDF.js Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="block bg-white shadow-xl rounded-sm"
          style={{
            width: renderedDimensions.width ? `${renderedDimensions.width}px` : 'auto',
            height: renderedDimensions.height ? `${renderedDimensions.height}px` : 'auto'
          }}
        />

        {/* Separate Annotation Overlay Layer */}
        <CanvasOverlay
          renderedWidth={renderedDimensions.width}
          renderedHeight={renderedDimensions.height}
          activePage={activePage}
          spaces={spaces}
          selectedSpaceId={selectedSpaceId}
          onSelectSpace={onSelectSpace}
          isEditingBoundary={isEditingBoundary}
          onUpdateSpacePolygon={onUpdateSpacePolygon}
          calibrationPointA={calibrationPointA}
          calibrationPointB={calibrationPointB}
          isDrawingArea={activeTool === 'draw-area'}
          drawPoints={drawPoints}
          onAddDrawPoint={pt => setDrawPoints(prev => [...prev, pt])}
          onFinishDrawArea={handleFinishDraw}
        />
      </div>
    </div>
  );
};
