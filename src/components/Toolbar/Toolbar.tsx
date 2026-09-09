import React from 'react';
import {
  MousePointer,
  Hand,
  Crosshair,
  PenTool,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Trash2,
  Save,
  Upload,
  Ruler,
  Compass,
  FolderOpen,
  LayoutDashboard,
  HelpCircle
} from 'lucide-react';

export type ActiveTool = 'select' | 'pan' | 'one-click' | 'draw-area' | 'calibrate';
export type ActiveTab = 'workspace' | 'saved-drawings' | 'dashboard' | 'help';

interface ToolbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onClear: () => void;
  onSave: () => void;
  onUploadClick: () => void;
  hasPdfLoaded: boolean;
  measurementCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTab,
  setActiveTab,
  activeTool,
  setActiveTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  onClear,
  onSave,
  onUploadClick,
  hasPdfLoaded,
  measurementCount
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Brand & Tabs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white tracking-wide text-sm">AREA ANNOTATOR</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono font-medium">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">Intelligent Floor Plan Takeoff</p>
          </div>
        </div>

        {/* View Switcher */}
        <nav className="flex items-center bg-slate-850 p-1 rounded-lg border border-slate-750">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'workspace'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('saved-drawings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'saved-drawings'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Saved Drawings
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'help'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </button>
        </nav>
      </div>

      {/* Main Workspace Actions */}
      {activeTab === 'workspace' && (
        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-brand-400" />
            Upload PDF
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* PRIMARY ONE CLICK ACTION */}
          <button
            onClick={() => setActiveTool('one-click')}
            disabled={!hasPdfLoaded}
            title="One Click Space Detection"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              !hasPdfLoaded
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                : activeTool === 'one-click'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-emerald-600/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${activeTool === 'one-click' ? 'animate-spin' : ''}`} />
            <span>ONE CLICK</span>
          </button>

          {/* Manual Draw Fallback */}
          <button
            onClick={() => setActiveTool('draw-area')}
            disabled={!hasPdfLoaded}
            title="Manual Draw Area"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              !hasPdfLoaded
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                : activeTool === 'draw-area'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Area</span>
          </button>

          {/* Select & Pan Tools */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setActiveTool('select')}
              disabled={!hasPdfLoaded}
              title="Select / Interact"
              className={`p-1.5 rounded-md text-xs transition ${
                activeTool === 'select'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              } ${!hasPdfLoaded ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <MousePointer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('pan')}
              disabled={!hasPdfLoaded}
              title="Pan Drawing"
              className={`p-1.5 rounded-md text-xs transition ${
                activeTool === 'pan'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              } ${!hasPdfLoaded ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Hand className="w-4 h-4" />
            </button>
          </div>

          {/* Scale Calibration */}
          <button
            onClick={() => setActiveTool('calibrate')}
            disabled={!hasPdfLoaded}
            title="Calibrate Drawing Scale"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              !hasPdfLoaded
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                : activeTool === 'calibrate'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-amber-400" />
            <span>Calibrate</span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={onZoomOut}
              disabled={!hasPdfLoaded}
              title="Zoom Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={onZoomIn}
              disabled={!hasPdfLoaded}
              title="Zoom In"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={onFit}
              disabled={!hasPdfLoaded}
              title="Fit to Screen"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Clear */}
          <button
            onClick={onClear}
            disabled={measurementCount === 0}
            title="Clear All Measurements"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={!hasPdfLoaded}
            title="Save Drawing to Firestore / Storage"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition ml-2"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      )}
    </header>
  );
};
