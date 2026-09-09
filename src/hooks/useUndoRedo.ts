import { useState, useCallback } from 'react';
import { Space } from '../types/space';

export interface HistoryAction {
  description: string;
  annotations: Space[];
}

export function useUndoRedo(initialAnnotations: Space[] = []) {
  const [past, setPast] = useState<HistoryAction[]>([]);
  const [present, setPresent] = useState<Space[]>(initialAnnotations);
  const [future, setFuture] = useState<HistoryAction[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const pushState = useCallback((newAnnotations: Space[], description: string = 'Update') => {
    setPast(prevPast => [...prevPast, { description, annotations: present }]);
    setPresent(newAnnotations);
    setFuture([]); // Clear future on new action
  }, [present]);

  const undo = useCallback(() => {
    if (!canUndo) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture(prevFuture => [{ description: 'Undo', annotations: present }, ...prevFuture]);
    setPresent(previous.annotations);
    setPast(newPast);
  }, [canUndo, past, present]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast(prevPast => [...prevPast, { description: 'Redo', annotations: present }]);
    setPresent(next.annotations);
    setFuture(newFuture);
  }, [canRedo, future, present]);

  const reset = useCallback((annotations: Space[]) => {
    setPast([]);
    setPresent(annotations);
    setFuture([]);
  }, []);

  return {
    annotations: present,
    setAnnotations: setPresent,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  };
}
