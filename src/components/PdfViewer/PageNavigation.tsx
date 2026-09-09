import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Ruler } from 'lucide-react';
import { PageScaleInfo } from '../../types/space';

interface PageNavigationProps {
  currentPage: number;
  pageCount: number;
  scale: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onResetZoom: () => void;
  scaleInfo?: PageScaleInfo | null;
  onCalibrateClick: () => void;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  pageCount,
  scale,
  onPrevPage,
  onNextPage,
  onResetZoom,
  scaleInfo,
  onCalibrateClick
}) => {
  return (
    <footer className="h-11 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 select-none shrink-0 z-20 text-xs text-slate-300">
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          className="p-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-2 font-medium font-mono text-slate-300">
          Page {currentPage} of {pageCount}
        </span>

        <button
          onClick={onNextPage}
          disabled={currentPage >= pageCount}
          className="p-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Drawing Scale Indicator */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCalibrateClick}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition ${
            scaleInfo?.calibrated
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Click to calibrate scale"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>{scaleInfo?.ratio || 'Scale: Uncalibrated'}</span>
        </button>
      </div>

      {/* Zoom Level & Reset */}
      <div className="flex items-center gap-2 font-mono">
        <span className="text-slate-400">{Math.round(scale * 100)}%</span>
        <button
          onClick={onResetZoom}
          className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
