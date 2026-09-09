import { useState, useCallback, useRef } from 'react';

export function usePdfViewer() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [renderedDimensions, setRenderedDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });

  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 4.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.4));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const fitWidth = useCallback((containerWidth: number, pageWidth: number) => {
    if (containerWidth > 0 && pageWidth > 0) {
      const padding = 48;
      const targetScale = (containerWidth - padding) / pageWidth;
      setScale(Math.max(0.4, Math.min(targetScale, 3.5)));
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const fitScreen = useCallback(
    (containerWidth: number, containerHeight: number, pageWidth: number, pageHeight: number) => {
      if (containerWidth > 0 && containerHeight > 0 && pageWidth > 0 && pageHeight > 0) {
        const padding = 64;
        const scaleX = (containerWidth - padding) / pageWidth;
        const scaleY = (containerHeight - padding) / pageHeight;
        const targetScale = Math.min(scaleX, scaleY);
        setScale(Math.max(0.4, Math.min(targetScale, 3.5)));
        setPan({ x: 0, y: 0 });
      }
    },
    []
  );

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, pageCount));
  }, [pageCount]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pageCount)));
  }, [pageCount]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    panStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
  }, [pan]);

  const updatePan = useCallback((clientX: number, clientY: number) => {
    setPan({
      x: clientX - panStartRef.current.x,
      y: clientY - panStartRef.current.y
    });
  }, []);

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  return {
    currentPage,
    setCurrentPage,
    pageCount,
    setPageCount,
    scale,
    setScale,
    pan,
    setPan,
    isPanning,
    renderedDimensions,
    setRenderedDimensions,
    zoomIn,
    zoomOut,
    resetZoom,
    fitWidth,
    fitScreen,
    nextPage,
    prevPage,
    goToPage,
    startPan,
    updatePan,
    endPan
  };
}
