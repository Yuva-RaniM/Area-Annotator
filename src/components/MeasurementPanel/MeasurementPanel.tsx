import React, { useState } from 'react';
import { Space } from '../../types/space';
import { Formatters } from '../../utils/formatters';
import {
  Square,
  Edit3,
  RefreshCw,
  Trash2,
  Check,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface MeasurementPanelProps {
  spaces: Space[];
  selectedSpaceId: string | null;
  onSelectSpace: (spaceId: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onRenameSpace: (spaceId: string, newName: string) => void;
  isEditingBoundary: boolean;
  onToggleEditBoundary: () => void;
  onRecalculateSpace: (spaceId: string) => void;
  onAiEnhance: (spaceId: string) => Promise<void>;
  currentPage: number;
  onNavigateToPage: (page: number) => void;
}

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onDeleteSpace,
  onRenameSpace,
  isEditingBoundary,
  onToggleEditBoundary,
  onRecalculateSpace,
  onAiEnhance,
  currentPage,
  onNavigateToPage
}) => {
  const [editingName, setEditingName] = useState<string>('');
  const [isEditingNameInline, setIsEditingNameInline] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const selectedSpace = spaces.find(s => s.id === selectedSpaceId);

  const handleStartRename = () => {
    if (!selectedSpace) return;
    setEditingName(selectedSpace.name);
    setIsEditingNameInline(true);
  };

  const handleSaveRename = () => {
    if (selectedSpace && editingName.trim()) {
      onRenameSpace(selectedSpace.id, editingName.trim());
    }
    setIsEditingNameInline(false);
  };

  const handleAiClick = async () => {
    if (!selectedSpace) return;
    setIsAiLoading(true);
    try {
      await onAiEnhance(selectedSpace.id);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Calculate total measured area (for spaces with valid area)
  const totalArea = spaces.reduce((acc, s) => acc + (s.area || 0), 0);

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none shrink-0 z-20 text-slate-100">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-xs tracking-wider uppercase text-slate-300 font-mono">
            Takeoff & Measurements
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          {spaces.length} spaces
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* SELECTED SPACE CARD */}
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-medium mb-2.5">
            Selected Space
          </h3>

          {selectedSpace ? (
            <div className="bg-slate-850 rounded-xl border border-slate-750 p-4 shadow-lg space-y-3.5">
              {/* Space Name & Edit Button */}
              <div className="flex items-center justify-between gap-2">
                {isEditingNameInline ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveRename()}
                      autoFocus
                      className="w-full bg-slate-900 border border-brand-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSaveRename}
                      className="p-1 rounded bg-brand-600 hover:bg-brand-500 text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: selectedSpace.color || '#0e8ce9' }}
                    />
                    <span className="font-semibold text-sm text-white truncate" title={selectedSpace.name}>
                      {selectedSpace.name}
                    </span>
                    <button
                      onClick={handleStartRename}
                      className="p-1 text-slate-400 hover:text-slate-200 transition"
                      title="Rename Space"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Page Badge */}
                {selectedSpace.pageNumber !== currentPage && (
                  <button
                    onClick={() => onNavigateToPage(selectedSpace.pageNumber)}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700 hover:bg-slate-750"
                    title="Jump to Page"
                  >
                    Pg {selectedSpace.pageNumber}
                  </button>
                )}
              </div>

              {/* Area Display */}
              <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Calculated Area</div>
                <div className="text-xl font-bold font-mono text-brand-400 mt-0.5">
                  {Formatters.formatArea(selectedSpace.area, selectedSpace.areaUnit)}
                </div>
              </div>

              {/* Space Metadata Grid */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Detection:</span>
                  <span className="font-medium text-slate-200">
                    {Formatters.formatDetectionMethod(selectedSpace.detectionMethod)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Area Source:</span>
                  <span className="font-medium text-slate-200">
                    {Formatters.formatAreaSource(selectedSpace.areaSource)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Confidence:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${Formatters.getConfidenceBadgeClass(
                      selectedSpace.confidence
                    )}`}
                  >
                    {selectedSpace.confidence}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onToggleEditBoundary}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition ${
                      isEditingBoundary
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>{isEditingBoundary ? 'Done Editing' : 'Edit Boundary'}</span>
                  </button>

                  <button
                    onClick={() => onRecalculateSpace(selectedSpace.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
                    title="Recalculate Area"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteSpace(selectedSpace.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                    title="Delete Space"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* AI Semantic Enhancement */}
                <button
                  onClick={handleAiClick}
                  disabled={isAiLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-purple-900/40 to-brand-900/40 hover:from-purple-900/60 hover:to-brand-900/60 text-purple-200 border border-purple-500/30 transition disabled:opacity-50"
                  title="Ask Gemini server to analyze room context and verify label"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiLoading ? 'Analyzing with Gemini...' : 'AI Context Classification'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-850/50 rounded-xl border border-dashed border-slate-800 p-6 text-center text-slate-500 text-xs">
              No space selected. Click a polygon or use One Click to detect an area.
            </div>
          )}
        </div>

        {/* MEASUREMENT LIST */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-medium">
              Measurements
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">{spaces.length} Total</span>
          </div>

          {spaces.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No measurements recorded yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {spaces.map((sp, idx) => {
                const isSelected = sp.id === selectedSpaceId;
                return (
                  <div
                    key={sp.id}
                    onClick={() => {
                      onSelectSpace(sp.id);
                      if (sp.pageNumber !== currentPage) {
                        onNavigateToPage(sp.pageNumber);
                      }
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-brand-500/50 text-white shadow-sm'
                        : 'bg-slate-850/70 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-slate-500 font-mono text-[11px] w-4 shrink-0">
                        {idx + 1}.
                      </span>
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sp.color || '#0e8ce9' }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate" title={sp.name}>
                          {sp.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Pg {sp.pageNumber} • {Formatters.formatAreaSource(sp.areaSource)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-brand-400 shrink-0">
                        {Formatters.formatArea(sp.area, sp.areaUnit)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY FOOTER */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Total Area:</span>
          <span className="font-bold font-mono text-sm text-brand-400">
            {Formatters.formatArea(totalArea, 'm²')}
          </span>
        </div>
      </div>
    </aside>
  );
};
