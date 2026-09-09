import React, { useState, useEffect } from 'react';
import { DrawingMetadata } from '../../types/drawing';
import { DrawingService } from '../../services/drawingService';
import { Formatters } from '../../utils/formatters';
import {
  FileText,
  Layers,
  Clock,
  TrendingUp,
  Upload,
  FolderOpen,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface DashboardProps {
  onOpenDrawing: (id: string) => void;
  onUploadClick: () => void;
  onNavigateSaved: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenDrawing,
  onUploadClick,
  onNavigateSaved
}) => {
  const [drawings, setDrawings] = useState<DrawingMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await DrawingService.getDrawings();
        setDrawings(data);
      } catch (err) {
        console.warn('Failed to load drawings in dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const totalDrawings = drawings.length;
  const totalMeasurements = drawings.reduce((acc, d) => acc + (d.measurementCount || 0), 0);
  const recentDrawings = drawings.slice(0, 5);

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto text-slate-100 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Quick Action Buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Project Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">
              Overview of architectural takeoffs, measurements, and stored floor plans
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateSaved}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition"
            >
              <FolderOpen className="w-4 h-4 text-brand-400" />
              <span>Browse Saved Drawings</span>
            </button>

            <button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload PDF Floor Plan</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Total Drawings</span>
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono mt-3">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" /> : totalDrawings}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Active architectural documents</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Total Measurements</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-400 font-mono mt-3">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" /> : totalMeasurements}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Enclosed spaces quantified</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Average Spaces / Plan</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-400 font-mono mt-3">
              {isLoading
                ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                : totalDrawings > 0
                ? (totalMeasurements / totalDrawings).toFixed(1)
                : '0'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Room annotations per sheet</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Last Modified</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-4 truncate">
              {drawings.length > 0 ? Formatters.formatDate(drawings[0].updatedAt) : 'None'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Most recent activity</div>
          </div>
        </div>

        {/* RECENT DRAWINGS LIST */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-semibold text-white tracking-wide">Recently Modified Drawings</h2>
            <button
              onClick={onNavigateSaved}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            </div>
          ) : recentDrawings.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No drawings saved yet. Upload a PDF floor plan in the workspace to start.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentDrawings.map(d => (
                <div
                  key={d.id}
                  onClick={() => onOpenDrawing(d.id)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-850/50 px-3 rounded-lg transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{d.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {d.fileName} • {d.pageCount} page(s)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
                    <span className="hidden sm:inline">{d.measurementCount || 0} spaces</span>
                    <span>{Formatters.formatDate(d.updatedAt)}</span>
                    <ArrowRight className="w-4 h-4 text-slate-600 hover:text-brand-400 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
