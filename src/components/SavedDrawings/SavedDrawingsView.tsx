import React, { useState, useEffect } from 'react';
import { DrawingMetadata } from '../../types/drawing';
import { DrawingService } from '../../services/drawingService';
import { Formatters } from '../../utils/formatters';
import {
  FolderOpen,
  Search,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface SavedDrawingsViewProps {
  onOpenDrawing: (drawingId: string) => Promise<void>;
  onUploadNew: () => void;
}

export const SavedDrawingsView: React.FC<SavedDrawingsViewProps> = ({
  onOpenDrawing,
  onUploadNew
}) => {
  const [drawings, setDrawings] = useState<DrawingMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const loadDrawings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await DrawingService.getDrawings();
      setDrawings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load drawings from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrawings();
  }, []);

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      return;
    }
    try {
      await DrawingService.deleteDrawing(id);
      setDrawings(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleOpen = async (id: string) => {
    setOpeningId(id);
    try {
      await onOpenDrawing(id);
    } catch (err: any) {
      alert(`Failed to open drawing: ${err.message}`);
    } finally {
      setOpeningId(null);
    }
  };

  const filtered = drawings.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    d.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto text-slate-100 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Saved Drawings</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Access previously saved architectural floor plans, calibrations, and measurements
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDrawings}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Drawings List"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onUploadNew}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 transition"
            >
              + Upload New PDF
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search saved drawings by name, description, or filename..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Drawings Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <span className="text-xs">Loading saved drawings from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">No Saved Drawings Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No drawings matched your search query.'
                  : 'Upload an architectural PDF in the workspace, add room measurements, and save.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={onUploadNew}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition"
              >
                Upload PDF Drawing
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(drawing => (
              <div
                key={drawing.id}
                onClick={() => handleOpen(drawing.id)}
                className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar with Icon & Delete */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition">
                      <FileText className="w-5 h-5" />
                    </div>

                    <button
                      onClick={e => handleDelete(drawing.id, drawing.name, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition"
                      title="Delete Drawing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-3">
                    <h3 className="font-semibold text-sm text-white group-hover:text-brand-400 transition truncate" title={drawing.name}>
                      {drawing.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 h-8">
                      {drawing.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Metadata & Footer */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{drawing.measurementCount || 0} measurements</span>
                    </span>
                    <span className="font-mono text-slate-500">{drawing.pageCount} page(s)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{Formatters.formatDate(drawing.updatedAt)}</span>
                    </span>

                    <span className="flex items-center gap-1 text-brand-400 font-semibold group-hover:translate-x-0.5 transition">
                      {openingId === drawing.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
