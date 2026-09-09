import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Toolbar, ActiveTool, ActiveTab } from './components/Toolbar/Toolbar';
import { PdfViewer } from './components/PdfViewer/PdfViewer';
import { PageNavigation } from './components/PdfViewer/PageNavigation';
import { LeftSidebar } from './components/Workspace/LeftSidebar';
import { MeasurementPanel } from './components/MeasurementPanel/MeasurementPanel';
import { ScaleCalibrationModal } from './components/ScaleCalibration/ScaleCalibrationModal';
import { UploadModal } from './components/UploadDialog/UploadModal';
import { SaveDrawingModal } from './components/SaveDrawingDialog/SaveDrawingModal';
import { SavedDrawingsView } from './components/SavedDrawings/SavedDrawingsView';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SettingsHelpView } from './components/Settings/SettingsHelpView';

import { pdfService } from './services/pdfService';
import { PdfTextService } from './services/pdfTextService';
import { PdfGeometryService } from './services/pdfGeometryService';
import { spaceDetectionService } from './services/spaceDetectionService';
import { ScaleDetectionService } from './services/scaleDetectionService';
import { AreaCalculationService } from './services/areaCalculationService';
import { DrawingService } from './services/drawingService';
import { AiInterpretationService } from './services/aiInterpretationService';
import { StorageService } from './services/storageService';

import { Space, PageScaleInfo } from './types/space';
import { Drawing } from './types/drawing';
import { PdfDocumentInfo, TextElement, VectorLine } from './types/pdf';
import { NormalizedPoint } from './types/coordinate';
import { CoordinateConverter } from './utils/coordinates';

import { useUndoRedo } from './hooks/useUndoRedo';
import { usePdfViewer } from './hooks/usePdfViewer';
import { useScaleCalibration } from './hooks/useScaleCalibration';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');

  // Drawing and Document state
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [pdfDocInfo, setPdfDocInfo] = useState<PdfDocumentInfo | null>(null);
  const [currentPdfSource, setCurrentPdfSource] = useState<ArrayBuffer | string | null>(null);
  const [scales, setScales] = useState<Record<number, PageScaleInfo>>({});

  // Annotations & Undo/Redo
  const {
    annotations,
    setAnnotations,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetUndoHistory
  } = useUndoRedo([]);

  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [isEditingBoundary, setIsEditingBoundary] = useState<boolean>(false);

  // PDF Page Metadata Cache
  const [pageTextCache, setPageTextCache] = useState<Map<number, TextElement[]>>(new Map());
  const [pageVectorCache, setPageVectorCache] = useState<Map<number, VectorLine[]>>(new Map());

  // UI Dialogs & Feedback
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // PDF Viewer hook
  const {
    currentPage,
    pageCount,
    setPageCount,
    scale,
    pan,
    isPanning,
    renderedDimensions,
    setRenderedDimensions,
    zoomIn,
    zoomOut,
    resetZoom,
    fitScreen,
    nextPage,
    prevPage,
    goToPage,
    startPan,
    updatePan,
    endPan
  } = usePdfViewer();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Scale Calibration Hook
  const activeScaleInfo = scales[currentPage] || null;

  const handleScaleCalibrated = useCallback(
    (newScale: PageScaleInfo) => {
      setScales(prev => {
        const updated = { ...prev, [currentPage]: newScale };
        return updated;
      });

      // Recalculate areas for existing annotations on this page
      if (canvasRef.current && renderedDimensions.width > 0) {
        const updatedAnnotations = annotations.map(sp => {
          if (sp.pageNumber === currentPage) {
            const recalc = AreaCalculationService.recalculateSpaceArea(
              sp.polygon,
              newScale,
              renderedDimensions,
              sp
            );
            return {
              ...sp,
              area: recalc.area,
              areaUnit: recalc.areaUnit,
              areaSource: recalc.areaSource,
              confidence: recalc.confidence,
              updatedAt: new Date().toISOString()
            };
          }
          return sp;
        });
        pushState(updatedAnnotations, 'Calibrate Scale');
      }

      setActiveTool('select');
    },
    [currentPage, annotations, renderedDimensions, pushState]
  );

  const {
    step: calibrationStep,
    pointA: calibrationPointA,
    pointB: calibrationPointB,
    distanceInput,
    setDistanceInput,
    unit: calibrationUnit,
    setUnit: setCalibrationUnit,
    error: calibrationError,
    startCalibration,
    cancelCalibration,
    handlePointClick: handleCalibrationPointClick,
    confirmCalibration
  } = useScaleCalibration(
    renderedDimensions.width,
    renderedDimensions.height,
    handleScaleCalibrated
  );

  // When Calibrate tool is chosen from Toolbar, start calibration sequence
  useEffect(() => {
    if (activeTool === 'calibrate') {
      startCalibration();
    } else if (calibrationStep !== 'idle') {
      cancelCalibration();
    }
  }, [activeTool]);

  // Load and render PDF page
  const renderCurrentPage = useCallback(async () => {
    if (!canvasRef.current || !currentPdfSource) return;

    try {
      setIsProcessing(true);
      setProcessingMessage(`Rendering page ${currentPage}...`);

      const result = await pdfService.renderPage({
        pageNumber: currentPage,
        scale,
        canvas: canvasRef.current
      });

      setRenderedDimensions({
        width: result.renderedWidth,
        height: result.renderedHeight
      });

      // Extract & cache text elements if not cached
      let texts = pageTextCache.get(currentPage);
      if (!texts) {
        const pageProxy = await pdfService.getPage(currentPage);
        texts = await PdfTextService.extractPageText(pageProxy);
        setPageTextCache(prev => new Map(prev).set(currentPage, texts!));

        // Auto-detect page scale if uncalibrated
        if (!scales[currentPage]) {
          const autoScale = ScaleDetectionService.detectScaleFromText(texts, {
            width: result.renderedWidth,
            height: result.renderedHeight
          });
          if (autoScale) {
            setScales(prev => ({ ...prev, [currentPage]: autoScale }));
          }
        }
      }

      // Extract & cache vector lines if not cached
      let vectors = pageVectorCache.get(currentPage);
      if (!vectors) {
        const pageProxy = await pdfService.getPage(currentPage);
        vectors = await PdfGeometryService.extractVectorLines(pageProxy);
        setPageVectorCache(prev => new Map(prev).set(currentPage, vectors!));
      }

      // Initialize page spatial model for One Click detection
      await spaceDetectionService.initializePageModel(
        currentPage,
        canvasRef.current,
        texts || [],
        scales[currentPage] || null
      );
    } catch (err: any) {
      console.error('Page render failed:', err);
      setErrorMessage(err.message || 'Failed to render PDF page.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentPage, scale, currentPdfSource, scales, pageTextCache, pageVectorCache]);

  // Trigger render when page or scale changes
  useEffect(() => {
    if (currentPdfSource) {
      renderCurrentPage();
    }
  }, [renderCurrentPage]);

  // Handle PDF File Upload
  const handlePdfUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfService.loadDocument(arrayBuffer);

      setCurrentPdfSource(arrayBuffer);
      setPageCount(pdf.numPages);
      goToPage(1);

      const docInfo: PdfDocumentInfo = {
        filename: file.name,
        fileSize: file.size,
        pageCount: pdf.numPages
      };
      setPdfDocInfo(docInfo);

      // Create new drawing container
      const newDrawing: Drawing = {
        id: `drawing-${Date.now()}`,
        name: file.name.replace(/\.pdf$/i, ''),
        description: '',
        fileUrl: '',
        fileName: file.name,
        fileSize: file.size,
        pageCount: pdf.numPages,
        measurementCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        annotations: []
      };

      setCurrentDrawing(newDrawing);
      resetUndoHistory([]);
      setSelectedSpaceId(null);
      setScales({});
      setActiveTab('workspace');
      setActiveTool('select');
    } catch (err: any) {
      setErrorMessage(`Failed to open PDF: ${err.message}`);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // ONE CLICK ROOM DETECTION HANDLER
  const handleOneClickDetect = async (clickNormalized: NormalizedPoint) => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    setProcessingMessage('Detecting actual enclosed space boundary...');
    setErrorMessage(null);

    try {
      const texts = pageTextCache.get(currentPage) || [];
      const currentScale = scales[currentPage] || null;

      const detectedSpace = await spaceDetectionService.detectSpaceAtPoint(
        clickNormalized,
        currentPage,
        canvasRef.current,
        texts,
        currentScale
      );

      if (!detectedSpace) {
        setErrorMessage(
          'No enclosed space could be detected at this location. Ensure the space has visible bounding walls, or use "Draw Area" to draw it manually.'
        );
        return;
      }

      // Add to annotations
      const updated = [...annotations, detectedSpace];
      pushState(updated, `Add ${detectedSpace.name}`);
      setSelectedSpaceId(detectedSpace.id);
      setActiveTool('select');
    } catch (err: any) {
      setErrorMessage(`Space detection failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // MANUAL DRAW AREA FINISH HANDLER
  const handleManualDrawFinish = (polygon: NormalizedPoint[]) => {
    const currentScale = scales[currentPage] || null;
    const recalc = AreaCalculationService.recalculateSpaceArea(
      polygon,
      currentScale,
      renderedDimensions
    );

    const boundingBox = CoordinateConverter.computeBoundingBox(polygon);

    const newSpace: Space = {
      id: `space-manual-${Date.now()}`,
      pageNumber: currentPage,
      name: `Manual Space ${annotations.length + 1}`,
      type: 'Room',
      polygon,
      boundingBox,
      area: recalc.area,
      areaUnit: recalc.areaUnit,
      areaSource: recalc.areaSource,
      confidence: recalc.confidence,
      detectionMethod: 'manual',
      color: '#10b981',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...annotations, newSpace];
    pushState(updated, `Draw ${newSpace.name}`);
    setSelectedSpaceId(newSpace.id);
    setActiveTool('select');
  };

  // BOUNDARY EDITING HANDLER
  const handleUpdateSpacePolygon = (spaceId: string, updatedPolygon: NormalizedPoint[]) => {
    const currentScale = scales[currentPage] || null;
    const recalc = AreaCalculationService.recalculateSpaceArea(
      updatedPolygon,
      currentScale,
      renderedDimensions
    );

    const boundingBox = CoordinateConverter.computeBoundingBox(updatedPolygon);

    const updated = annotations.map(sp => {
      if (sp.id === spaceId) {
        return {
          ...sp,
          polygon: updatedPolygon,
          boundingBox,
          area: recalc.area,
          areaUnit: recalc.areaUnit,
          areaSource: recalc.areaSource,
          confidence: recalc.confidence,
          updatedAt: new Date().toISOString()
        };
      }
      return sp;
    });

    // Directly set state during drag, push on finish
    setAnnotations(updated);
  };

  // RECALCULATE SPACE AREA
  const handleRecalculateSpace = (spaceId: string) => {
    const currentScale = scales[currentPage] || null;
    const updated = annotations.map(sp => {
      if (sp.id === spaceId) {
        const recalc = AreaCalculationService.recalculateSpaceArea(
          sp.polygon,
          currentScale,
          renderedDimensions
        );
        return {
          ...sp,
          area: recalc.area,
          areaUnit: recalc.areaUnit,
          areaSource: recalc.areaSource,
          confidence: recalc.confidence,
          updatedAt: new Date().toISOString()
        };
      }
      return sp;
    });
    pushState(updated, 'Recalculate Area');
  };

  // DELETE SPACE
  const handleDeleteSpace = (spaceId: string) => {
    const space = annotations.find(s => s.id === spaceId);
    const updated = annotations.filter(s => s.id !== spaceId);
    pushState(updated, `Delete ${space?.name || 'Space'}`);
    if (selectedSpaceId === spaceId) {
      setSelectedSpaceId(null);
      setIsEditingBoundary(false);
    }
  };

  // RENAME SPACE
  const handleRenameSpace = (spaceId: string, newName: string) => {
    const updated = annotations.map(sp => {
      if (sp.id === spaceId) {
        return { ...sp, name: newName, updatedAt: new Date().toISOString() };
      }
      return sp;
    });
    pushState(updated, `Rename Space to ${newName}`);
  };

  // CLEAR ALL MEASUREMENTS
  const handleClearAll = () => {
    if (annotations.length === 0) return;
    if (confirm('Clear all measurements from this drawing?')) {
      pushState([], 'Clear All Measurements');
      setSelectedSpaceId(null);
      setIsEditingBoundary(false);
    }
  };

  // AI SEMANTIC ENHANCEMENT
  const handleAiEnhance = async (spaceId: string) => {
    const space = annotations.find(s => s.id === spaceId);
    if (!space) return;

    const texts = pageTextCache.get(space.pageNumber) || [];
    const nearby = texts.slice(0, 15).map(t => t.text);

    const result = await AiInterpretationService.analyzeSpaceContext(space, nearby);
    if (result && result.suggestedName) {
      const updated = annotations.map(sp => {
        if (sp.id === spaceId) {
          return {
            ...sp,
            name: result.suggestedName || sp.name,
            type: result.category || sp.type,
            confidence: result.confidence || sp.confidence,
            detectionMethod: 'ai-assisted' as const,
            updatedAt: new Date().toISOString()
          };
        }
        return sp;
      });
      pushState(updated, `AI Enhanced ${result.suggestedName}`);
    }
  };

  // SAVE DRAWING
  const handleConfirmSave = async (name: string, description: string) => {
    if (!currentDrawing) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const drawingToSave: Drawing = {
        ...currentDrawing,
        name,
        description,
        scales,
        annotations,
        measurementCount: annotations.length,
        updatedAt: new Date().toISOString()
      };

      const saved = await DrawingService.saveDrawing(drawingToSave);
      setCurrentDrawing(saved);
      StorageService.saveRecentDrawingId(saved.id);
      alert(`Drawing "${saved.name}" saved successfully with ${saved.measurementCount} annotations!`);
    } catch (err: any) {
      setErrorMessage(`Failed to save drawing: ${err.message}`);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // OPEN SAVED DRAWING (MANDATORY REOPEN ACCEPTANCE WORKFLOW)
  const handleOpenSavedDrawing = async (drawingId: string) => {
    setIsProcessing(true);
    setProcessingMessage('Restoring saved drawing and exact annotations...');
    setErrorMessage(null);

    try {
      const savedDrawing = await DrawingService.getDrawingById(drawingId);

      // Load PDF from saved URL or binary source
      if (savedDrawing.fileUrl) {
        await pdfService.loadDocument(savedDrawing.fileUrl);
        setCurrentPdfSource(savedDrawing.fileUrl);
      }

      setCurrentDrawing(savedDrawing);
      setPdfDocInfo({
        filename: savedDrawing.fileName,
        fileSize: savedDrawing.fileSize || 0,
        pageCount: savedDrawing.pageCount
      });
      setPageCount(savedDrawing.pageCount);

      // Restore scales and exact annotations
      if (savedDrawing.scales) {
        setScales(savedDrawing.scales);
      }
      resetUndoHistory(savedDrawing.annotations || []);
      setSelectedSpaceId(null);
      setIsEditingBoundary(false);

      goToPage(1);
      setActiveTab('workspace');
      setActiveTool('select');
    } catch (err: any) {
      setErrorMessage(`Failed to open drawing: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Application Toolbar */}
      <Toolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={() => {
          if (canvasRef.current) {
            fitScreen(window.innerWidth - 600, window.innerHeight - 150, 595, 842);
          }
        }}
        onClear={handleClearAll}
        onSave={() => setIsSaveModalOpen(true)}
        onUploadClick={() => setIsUploadModalOpen(true)}
        hasPdfLoaded={Boolean(currentPdfSource)}
        measurementCount={annotations.length}
      />

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'workspace' && (
          <>
            {/* Left Sidebar (Document & Pages) */}
            <LeftSidebar
              docInfo={pdfDocInfo}
              currentPage={currentPage}
              pageCount={pageCount}
              onSelectPage={goToPage}
              hasAnalyzedCurrentPage={Boolean(spaceDetectionService.getSpatialModel(currentPage))}
              textElementCount={pageTextCache.get(currentPage)?.length || 0}
              vectorLineCount={pageVectorCache.get(currentPage)?.length || 0}
            />

            {/* Center Area: PDF Viewer & Canvas */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {currentPdfSource ? (
                <>
                  <PdfViewer
                    canvasRef={canvasRef}
                    renderedDimensions={renderedDimensions}
                    activePage={currentPage}
                    scale={scale}
                    pan={pan}
                    isPanning={isPanning}
                    startPan={startPan}
                    updatePan={updatePan}
                    endPan={endPan}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    spaces={annotations}
                    selectedSpaceId={selectedSpaceId}
                    onSelectSpace={setSelectedSpaceId}
                    isEditingBoundary={isEditingBoundary}
                    onUpdateSpacePolygon={handleUpdateSpacePolygon}
                    onOneClickDetect={handleOneClickDetect}
                    calibrationPointA={calibrationPointA}
                    calibrationPointB={calibrationPointB}
                    onCalibrationCanvasClick={handleCalibrationPointClick}
                    calibrationStep={calibrationStep}
                    onManualDrawFinish={handleManualDrawFinish}
                    isProcessing={isProcessing}
                    processingMessage={processingMessage}
                    errorMessage={errorMessage}
                    onClearError={() => setErrorMessage(null)}
                  />

                  {/* Scale Calibration Dialog Floating Card */}
                  <ScaleCalibrationModal
                    step={calibrationStep}
                    pointA={calibrationPointA}
                    pointB={calibrationPointB}
                    distanceInput={distanceInput}
                    setDistanceInput={setDistanceInput}
                    unit={calibrationUnit}
                    setUnit={setCalibrationUnit}
                    error={calibrationError}
                    onConfirm={confirmCalibration}
                    onCancel={() => {
                      cancelCalibration();
                      setActiveTool('select');
                    }}
                  />

                  {/* Page Navigation Footer */}
                  <PageNavigation
                    currentPage={currentPage}
                    pageCount={pageCount}
                    scale={scale}
                    onPrevPage={prevPage}
                    onNextPage={nextPage}
                    onResetZoom={resetZoom}
                    scaleInfo={activeScaleInfo}
                    onCalibrateClick={() => setActiveTool('calibrate')}
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-slate-950">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20 shadow-xl">
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">No Architectural Drawing Open</h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">
                      Upload an architectural floor plan PDF to begin intelligent takeoff, room detection, and area measurement.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-600/30 transition transform hover:-translate-y-0.5"
                  >
                    Upload Floor Plan PDF
                  </button>
                </div>
              )}
            </div>

            {/* Right Measurement Panel */}
            <MeasurementPanel
              spaces={annotations}
              selectedSpaceId={selectedSpaceId}
              onSelectSpace={setSelectedSpaceId}
              onDeleteSpace={handleDeleteSpace}
              onRenameSpace={handleRenameSpace}
              isEditingBoundary={isEditingBoundary}
              onToggleEditBoundary={() => setIsEditingBoundary(prev => !prev)}
              onRecalculateSpace={handleRecalculateSpace}
              onAiEnhance={handleAiEnhance}
              currentPage={currentPage}
              onNavigateToPage={goToPage}
            />
          </>
        )}

        {/* Saved Drawings View */}
        {activeTab === 'saved-drawings' && (
          <SavedDrawingsView
            onOpenDrawing={handleOpenSavedDrawing}
            onUploadNew={() => setIsUploadModalOpen(true)}
          />
        )}

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenDrawing={handleOpenSavedDrawing}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onNavigateSaved={() => setActiveTab('saved-drawings')}
          />
        )}

        {/* Settings & Help Documentation View */}
        {activeTab === 'help' && <SettingsHelpView />}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileSelected={handlePdfUpload}
        isUploading={isUploading}
      />

      {/* Save Drawing Modal */}
      <SaveDrawingModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirmSave={handleConfirmSave}
        defaultName={currentDrawing?.name || 'Architectural Floor Plan'}
        isSaving={isSaving}
        measurementCount={annotations.length}
      />
    </div>
  );
}
