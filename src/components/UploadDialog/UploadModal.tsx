import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { Formatters } from '../../utils/formatters';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFileSelected,
  isUploading
}) => {
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a valid architectural PDF file.');
      return;
    }
    if (file.size <= 0) {
      setError('The selected PDF file is empty.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds the 100MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;
    try {
      await onFileSelected(selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to open PDF.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Upload Architectural PDF</h3>
              <p className="text-xs text-slate-400">Open a floor plan or blueprint drawing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-brand-500 bg-brand-500/10'
              : selectedFile
              ? 'border-emerald-500/60 bg-emerald-500/5'
              : 'border-slate-750 hover:border-slate-600 bg-slate-850/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                validateAndSetFile(e.target.files[0]);
              }
            }}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-medium text-white">{selectedFile.name}</div>
              <div className="text-xs text-slate-400 font-mono">
                {Formatters.formatFileSize(selectedFile.size)}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-medium text-slate-200">
                Drag and drop your PDF floor plan here
              </div>
              <div className="text-xs text-slate-500">or click to browse from device</div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brand-600/20 transition"
          >
            {isUploading ? 'Loading PDF...' : 'Open Drawing'}
          </button>
        </div>
      </div>
    </div>
  );
};
