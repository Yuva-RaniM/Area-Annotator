import React from 'react';
import { Ruler, X, Check, AlertCircle } from 'lucide-react';
import { CalibrationStep } from '../../hooks/useScaleCalibration';
import { NormalizedPoint } from '../../types/coordinate';

interface ScaleCalibrationModalProps {
  step: CalibrationStep;
  pointA: NormalizedPoint | null;
  pointB: NormalizedPoint | null;
  distanceInput: string;
  setDistanceInput: (val: string) => void;
  unit: 'm' | 'ft' | 'mm';
  setUnit: (u: 'm' | 'ft' | 'mm') => void;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ScaleCalibrationModal: React.FC<ScaleCalibrationModalProps> = ({
  step,
  pointA,
  pointB,
  distanceInput,
  setDistanceInput,
  unit,
  setUnit,
  error,
  onConfirm,
  onCancel
}) => {
  if (step === 'idle') return null;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-md w-96 text-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
          <Ruler className="w-4 h-4" />
          <span>Calibrate Drawing Scale</span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {step === 'pick_first' && (
          <p className="text-xs text-slate-300">
            Click the <strong className="text-amber-400">first point</strong> on a known dimension or wall line in the drawing.
          </p>
        )}

        {step === 'pick_second' && (
          <p className="text-xs text-slate-300">
            First point captured! Now click the <strong className="text-amber-400">second point</strong> at the end of the dimension line.
          </p>
        )}

        {step === 'confirm_distance' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Enter the real-world distance between the two selected points:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={distanceInput}
                onChange={e => setDistanceInput(e.target.value)}
                autoFocus
                className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="m">Meters (m)</option>
                <option value="ft">Feet (ft)</option>
                <option value="mm">Millimeters (mm)</option>
              </select>
              <button
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1.5 text-rose-400 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={onCancel}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            Cancel Calibration
          </button>
        </div>
      </div>
    </div>
  );
};
