import { describe, it, expect } from 'vitest';
import { Space } from '../src/types/space';

// Test history state machine directly
class HistoryManager<T> {
  past: T[] = [];
  present: T;
  future: T[] = [];

  constructor(initial: T) {
    this.present = initial;
  }

  push(newVal: T) {
    this.past.push(this.present);
    this.present = newVal;
    this.future = [];
  }

  undo(): boolean {
    if (this.past.length === 0) return false;
    const prev = this.past.pop()!;
    this.future.unshift(this.present);
    this.present = prev;
    return true;
  }

  redo(): boolean {
    if (this.future.length === 0) return false;
    const next = this.future.shift()!;
    this.past.push(this.present);
    this.present = next;
    return true;
  }
}

describe('Undo / Redo History Stack', () => {
  const dummySpace1: Partial<Space> = { id: '1', name: 'Reception', area: 95.10 };
  const dummySpace2: Partial<Space> = { id: '2', name: 'Office', area: 41.25 };

  it('should push new states and allow undoing back to initial state', () => {
    const history = new HistoryManager<any[]>([]);

    expect(history.present.length).toBe(0);
    expect(history.undo()).toBe(false); // cannot undo initial

    // Action 1: Add reception
    history.push([dummySpace1]);
    expect(history.present.length).toBe(1);

    // Action 2: Add office
    history.push([dummySpace1, dummySpace2]);
    expect(history.present.length).toBe(2);

    // Undo Action 2
    expect(history.undo()).toBe(true);
    expect(history.present.length).toBe(1);
    expect(history.present[0].name).toBe('Reception');

    // Undo Action 1
    expect(history.undo()).toBe(true);
    expect(history.present.length).toBe(0);

    // Redo Action 1
    expect(history.redo()).toBe(true);
    expect(history.present.length).toBe(1);
    expect(history.present[0].name).toBe('Reception');

    // Redo Action 2
    expect(history.redo()).toBe(true);
    expect(history.present.length).toBe(2);
  });

  it('should clear future when a new action is performed after undo', () => {
    const history = new HistoryManager<string[]>(['A']);
    history.push(['A', 'B']);
    history.push(['A', 'B', 'C']);

    history.undo(); // back to ['A', 'B']
    expect(history.future.length).toBe(1);

    // New action performed: adds 'D' instead of redoing 'C'
    history.push(['A', 'B', 'D']);
    expect(history.future.length).toBe(0); // Future must be cleared!
    expect(history.redo()).toBe(false); // cannot redo
  });
});
