import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Sparkles, Layers, Sliders } from 'lucide-react';
import { PdfDocumentInfo } from '../../types/pdf';
import { Formatters } from '../../utils/formatters';

interface LeftSidebarProps {
  docInfo: PdfDocumentInfo | null;
  currentPage: number;
  pageCount: number;
  onSelectPage: (page: number) => void;
  hasAnalyzedCurrentPage: boolean;
  textElementCount: number;
  vectorLineCount: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  docInfo,
  currentPage,
  pageCount,
  onSelectPage,
  hasAnalyzedCurrentPage,
  textElementCount,
  vectorLineCount
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0 z-20 text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-xs tracking-wider uppercase text-slate-300 font-mono">
            Document & Pages
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Drawing Info */}
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-medium mb-2.5">
            File Information
          </h3>
          {docInfo ? (
            <div className="bg-slate-850 rounded-xl border border-slate-750 p-3.5 space-y-2 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 font-mono">FILE NAME</div>
                <div className="font-medium text-slate-200 truncate mt-0.5" title={docInfo.filename}>
                  {docInfo.filename}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">SIZE</div>
                  <div className="font-mono text-slate-300 mt-0.5">
                    {Formatters.formatFileSize(docInfo.fileSize)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">PAGES</div>
                  <div className="font-mono text-slate-300 mt-0.5">{docInfo.pageCount}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs py-3 text-center bg-slate-850/50 rounded-lg border border-slate-800">
              No PDF loaded.
            </div>
          )}
        </div>

        {/* Page List / Thumbnails */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-medium">
              Pages ({pageCount})
            </h3>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
              <button
                key={`page-btn-${page}`}
                onClick={() => onSelectPage(page)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  page === currentPage
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-sm'
                    : 'bg-slate-850/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 font-mono text-[11px] text-slate-500">#{page}</span>
                  <span>Sheet {page}</span>
                </div>
                {page === currentPage && (
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Status */}
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-medium mb-2.5">
            Page Spatial Analysis
          </h3>
          <div className="bg-slate-850 rounded-xl border border-slate-750 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Analysis Status:</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Text Entities:</span>
              <span className="font-mono text-slate-200">{textElementCount}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Vector Elements:</span>
              <span className="font-mono text-slate-200">{vectorLineCount}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Wall Engine:</span>
              <span className="font-mono text-emerald-400">Raster + Vector</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
