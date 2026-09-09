import { useState, useCallback } from 'react';
import { NormalizedPoint } from '../types/coordinate';
import { PageScaleInfo } from '../types/space';
import { ScaleDetectionService } from '../services/scaleDetectionService';

export type CalibrationStep = 'idle' | 'pick_first' | 'pick_second' | 'confirm_distance';

export function useScaleCalibration(
  canvasWidth: number,
  canvasHeight: number,
  onScaleCalibrated: (scale: PageScaleInfo) => void
) {
  const [step, setStep] = useState<CalibrationStep>('idle');
  const [pointA, setPointA] = useState<NormalizedPoint | null>(null);
  const [pointB, setPointB] = useState<NormalizedPoint | null>(null);
  const [distanceInput, setDistanceInput] = useState<string>('5.0');
  const [unit, setUnit] = useState<'m' | 'ft' | 'mm'>('m');
  const [error, setError] = useState<string | null>(null);

  const startCalibration = useCallback(() => {
    setStep('pick_first');
    setPointA(null);
    setPointB(null);
    setError(null);
  }, []);

  const cancelCalibration = useCallback(() => {
    setStep('idle');
    setPointA(null);
    setPointB(null);
    setError(null);
  }, []);

  const handlePointClick = useCallback(
    (point: NormalizedPoint): boolean => {
      if (step === 'pick_first') {
        setPointA(point);
        setStep('pick_second');
        return true; // handled
      } else if (step === 'pick_second') {
        setPointB(point);
        setStep('confirm_distance');
        return true; // handled
      }
      return false;
    },
    [step]
  );

  const confirmCalibration = useCallback(() => {
    if (!pointA || !pointB) {
      setError('Both calibration points must be selected.');
      return;
    }

    const dist = parseFloat(distanceInput);
    if (isNaN(dist) || dist <= 0) {
      setError('Please enter a valid positive distance.');
      return;
    }

    try {
      const scaleInfo = ScaleDetectionService.calibrateFromPoints(
        pointA,
        pointB,
        dist,
        unit,
        canvasWidth,
        canvasHeight
      );

      onScaleCalibrated(scaleInfo);
      setStep('idle');
      setPointA(null);
      setPointB(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Calibration failed.');
    }
  }, [pointA, pointB, distanceInput, unit, canvasWidth, canvasHeight, onScaleCalibrated]);

  return {
    step,
    isCalibrating: step !== 'idle',
    pointA,
    pointB,
    distanceInput,
    setDistanceInput,
    unit,
    setUnit,
    error,
    startCalibration,
    cancelCalibration,
    handlePointClick,
    confirmCalibration
  };
}
