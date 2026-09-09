import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Space } from '../../types/space';
import { NormalizedPoint } from '../../types/coordinate';
import { CoordinateConverter } from '../../utils/coordinates';
import { GeometryUtils } from '../../utils/geometry';
import { Formatters } from '../../utils/formatters';

interface CanvasOverlayProps {
  renderedWidth: number;
  renderedHeight: number;
  activePage: number;
  spaces: Space[];
  selectedSpaceId: string | null;
  onSelectSpace: (spaceId: string | null) => void;
  isEditingBoundary: boolean;
  onUpdateSpacePolygon: (spaceId: string, polygon: NormalizedPoint[]) => void;
  // Calibration line overlay
  calibrationPointA: NormalizedPoint | null;
  calibrationPointB: NormalizedPoint | null;
  // Manual draw polygon state
  isDrawingArea: boolean;
  drawPoints: NormalizedPoint[];
  onAddDrawPoint: (pt: NormalizedPoint) => void;
  onFinishDrawArea: () => void;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  renderedWidth,
  renderedHeight,
  activePage,
  spaces,
  selectedSpaceId,
  onSelectSpace,
  isEditingBoundary,
  onUpdateSpacePolygon,
  calibrationPointA,
  calibrationPointB,
  isDrawingArea,
  drawPoints,
  onAddDrawPoint,
  onFinishDrawArea
}) => {
  const [draggedVertexIndex, setDraggedVertexIndex] = useState<number | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ edgeIndex: number; insertPoint: NormalizedPoint } | null>(null);
  const [mousePos, setMousePos] = useState<NormalizedPoint | null>(null);

  const overlayRef = useRef<SVGSVGElement | null>(null);

  // Filter spaces that belong to current page
  const pageSpaces = spaces.filter(s => s.pageNumber === activePage);
  const selectedSpace = pageSpaces.find(s => s.id === selectedSpaceId);

  // Convert client coordinate on SVG to normalized [0, 1]
  const getNormalizedPoint = useCallback(
    (e: React.MouseEvent): NormalizedPoint | null => {
      if (!overlayRef.current) return null;
      const rect = overlayRef.current.getBoundingClientRect();
      return CoordinateConverter.clientToNormalized(e.clientX, e.clientY, rect);
    },
    []
  );

  // Mouse move handler for dragging vertices or edge preview
  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = getNormalizedPoint(e);
    if (!pt) return;
    setMousePos(pt);

    if (draggedVertexIndex !== null && selectedSpace && isEditingBoundary) {
      const updated = [...selectedSpace.polygon];
      updated[draggedVertexIndex] = pt;
      onUpdateSpacePolygon(selectedSpace.id, updated);
      return;
    }

    if (isEditingBoundary && selectedSpace) {
      const edge = GeometryUtils.findClosestEdge(pt, selectedSpace.polygon, 0.02);
      setHoveredEdge(edge);
    }
  };

  const handleMouseUp = () => {
    setDraggedVertexIndex(null);
  };

  // Vertex Drag Start
  const handleVertexMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditingBoundary) return;
    setDraggedVertexIndex(index);
  };

  // Remove vertex on right click or Alt+click
  const handleVertexContextMenu = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditingBoundary || !selectedSpace) return;
    if (selectedSpace.polygon.length <= 3) {
      alert('A polygon must have at least 3 vertices.');
      return;
    }
    const updated = selectedSpace.polygon.filter((_, i) => i !== index);
    onUpdateSpacePolygon(selectedSpace.id, updated);
  };

  // Insert vertex on edge click
  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditingBoundary || !selectedSpace || !hoveredEdge) return;
    const updated = [...selectedSpace.polygon];
    updated.splice(hoveredEdge.edgeIndex, 0, hoveredEdge.insertPoint);
    onUpdateSpacePolygon(selectedSpace.id, updated);
    setHoveredEdge(null);
  };

  // Convert normalized polygon to SVG points string: "x1,y1 x2,y2 ..."
  const polygonToSvgPoints = (polygon: NormalizedPoint[]): string => {
    return polygon
      .map(p => `${p.x * renderedWidth},${p.y * renderedHeight}`)
      .join(' ');
  };

  if (renderedWidth <= 0 || renderedHeight <= 0) return null;

  return (
    <svg
      ref={overlayRef}
      className="absolute inset-0 pointer-events-auto select-none z-10"
      style={{
        width: `${renderedWidth}px`,
        height: `${renderedHeight}px`
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setDraggedVertexIndex(null);
        setHoveredEdge(null);
        setMousePos(null);
      }}
    >
      <defs>
        {/* Glow filter for selected spaces */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38a8f6" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* RENDER ENCLOSED SPACE POLYGONS */}
      {pageSpaces.map(space => {
        const isSelected = space.id === selectedSpaceId;
        const color = space.color || '#0e8ce9';
        const pointsString = polygonToSvgPoints(space.polygon);
        const centroid = GeometryUtils.calculateCentroid(space.polygon);
        const cx = centroid.x * renderedWidth;
        const cy = centroid.y * renderedHeight;

        return (
          <g key={space.id} className="cursor-pointer group">
            {/* Polygon Shape */}
            <polygon
              points={pointsString}
              fill={color}
              fillOpacity={isSelected ? 0.35 : 0.2}
              stroke={isSelected ? '#38a8f6' : color}
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeDasharray={isSelected ? 'none' : 'none'}
              filter={isSelected ? 'url(#glow)' : undefined}
              className="transition-all duration-150"
              onClick={e => {
                e.stopPropagation();
                onSelectSpace(space.id);
              }}
            />

            {/* Room Label & Area Badge at Centroid */}
            <g
              transform={`translate(${cx}, ${cy})`}
              className="pointer-events-none select-none transition-opacity"
            >
              <rect
                x="-50"
                y="-18"
                width="100"
                height="36"
                rx="6"
                fill="#0f172a"
                fillOpacity="0.85"
                stroke={isSelected ? '#38a8f6' : '#334155'}
                strokeWidth="1"
              />
              <text
                x="0"
                y="-3"
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#f8fafc"
                className="font-sans"
              >
                {space.name.length > 15 ? space.name.substring(0, 13) + '…' : space.name}
              </text>
              <text
                x="0"
                y="10"
                textAnchor="middle"
                fontSize="9"
                fontWeight="500"
                fill="#38a8f6"
                className="font-mono"
              >
                {Formatters.formatArea(space.area, space.areaUnit)}
              </text>
            </g>
          </g>
        );
      })}

      {/* EDIT BOUNDARY VERTEX HANDLES */}
      {isEditingBoundary && selectedSpace && (
        <g className="boundary-editor">
          {/* Edge Insert Handle Preview */}
          {hoveredEdge && (
            <circle
              cx={hoveredEdge.insertPoint.x * renderedWidth}
              cy={hoveredEdge.insertPoint.y * renderedHeight}
              r="5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-crosshair animate-pulse"
              onClick={handleEdgeClick}
            />
          )}

          {/* Draggable Vertices */}
          {selectedSpace.polygon.map((vertex, idx) => {
            const vx = vertex.x * renderedWidth;
            const vy = vertex.y * renderedHeight;
            const isDragging = draggedVertexIndex === idx;

            return (
              <g key={`vertex-${idx}`} className="cursor-grab active:cursor-grabbing">
                <circle
                  cx={vx}
                  cy={vy}
                  r={isDragging ? 7 : 5}
                  fill={isDragging ? '#10b981' : '#ffffff'}
                  stroke="#0e8ce9"
                  strokeWidth="2"
                  onMouseDown={e => handleVertexMouseDown(idx, e)}
                  onContextMenu={e => handleVertexContextMenu(idx, e)}
                />
              </g>
            );
          })}
        </g>
      )}

      {/* MANUAL DRAW AREA PREVIEW */}
      {isDrawingArea && (
        <g className="manual-draw-preview">
          {drawPoints.length > 0 && (
            <>
              {/* Path of confirmed points */}
              <polyline
                points={drawPoints.map(p => `${p.x * renderedWidth},${p.y * renderedHeight}`).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Dynamic rubberband line to cursor */}
              {mousePos && (
                <line
                  x1={drawPoints[drawPoints.length - 1].x * renderedWidth}
                  y1={drawPoints[drawPoints.length - 1].y * renderedHeight}
                  x2={mousePos.x * renderedWidth}
                  y2={mousePos.y * renderedHeight}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Draw points */}
              {drawPoints.map((pt, i) => (
                <circle
                  key={`draw-pt-${i}`}
                  cx={pt.x * renderedWidth}
                  cy={pt.y * renderedHeight}
                  r={i === 0 ? 6 : 4}
                  fill={i === 0 ? '#10b981' : '#ffffff'}
                  stroke="#059669"
                  strokeWidth="2"
                  className={i === 0 && drawPoints.length >= 3 ? 'cursor-pointer animate-pulse' : ''}
                  onClick={e => {
                    if (i === 0 && drawPoints.length >= 3) {
                      e.stopPropagation();
                      onFinishDrawArea();
                    }
                  }}
                />
              ))}
            </>
          )}
        </g>
      )}

      {/* SCALE CALIBRATION LINE */}
      {calibrationPointA && (
        <g className="calibration-line pointer-events-none">
          <circle
            cx={calibrationPointA.x * renderedWidth}
            cy={calibrationPointA.y * renderedHeight}
            r="6"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {calibrationPointB ? (
            <>
              <circle
                cx={calibrationPointB.x * renderedWidth}
                cy={calibrationPointB.y * renderedHeight}
                r="6"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <line
                x1={calibrationPointA.x * renderedWidth}
                y1={calibrationPointA.y * renderedHeight}
                x2={calibrationPointB.x * renderedWidth}
                y2={calibrationPointB.y * renderedHeight}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
            </>
          ) : (
            mousePos && (
              <line
                x1={calibrationPointA.x * renderedWidth}
                y1={calibrationPointA.y * renderedHeight}
                x2={mousePos.x * renderedWidth}
                y2={mousePos.y * renderedHeight}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            )
          )}
        </g>
      )}
    </svg>
  );
};
