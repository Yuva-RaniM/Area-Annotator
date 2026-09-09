import React, { useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';

interface SaveDrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: (name: string, description: string) => Promise<void>;
  defaultName: string;
  isSaving: boolean;
  measurementCount: number;
}

export const SaveDrawingModal: React.FC<SaveDrawingModalProps> = ({
  isOpen,
  onClose,
  onConfirmSave,
  defaultName,
  isSaving,
  measurementCount
}) => {
  const [name, setName] = useState<string>(defaultName);
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Drawing name is required.');
      return;
    }
    try {
      await onConfirmSave(name.trim(), description.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save drawing.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Save Drawing</h3>
              <p className="text-xs text-slate-400 font-mono">
                Persisting {measurementCount} measurements to database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Drawing Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Ground Floor Plan - Level 1"
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Architectural takeoff with residential rooms and area takeoffs"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brand-600/20 transition"
            >
              {isSaving ? 'Saving...' : 'Save Drawing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
