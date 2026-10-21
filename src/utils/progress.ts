import type { Routine, Workout } from '../types';
import { toNumber } from './stats';

export type ExerciseProgress = {
  exerciseId: string;
  unit: 'kg' | 'reps';
  // Best set of each session, oldest first.
  values: number[];
  first: number;
  latest: number;
  gain: number;
  gainPct: number;
};

// Rotate through routines: suggest the one after the last routine trained.
export function nextRoutine(routines: Routine[], history: Workout[]): Routine | undefined {
  const last = history.find((w) => routines.some((r) => r.id === w.routineId));
  if (!last) return routines[0];
  const i = routines.findIndex((r) => r.id === last.routineId);
  return routines[(i + 1) % routines.length];
}

// Heaviest weight per session; bodyweight exercises (0 kg) track reps instead.
export function exerciseProgress(history: Workout[]): ExerciseProgress[] {
  const series = new Map<string, { unit: 'kg' | 'reps'; values: number[] }>();
  const oldestFirst = [...history].sort((a, b) => a.startedAt - b.startedAt);

  for (const w of oldestFirst) {
    for (const e of w.exercises) {
      const done = e.sets.filter((s) => s.done);
      if (done.length === 0) continue;
      const maxWeight = Math.max(...done.map((s) => toNumber(s.weight)));
      const unit = maxWeight > 0 ? 'kg' : 'reps';
      const value = unit === 'kg' ? maxWeight : Math.max(...done.map((s) => toNumber(s.reps)));
      const entry = series.get(e.exerciseId) ?? { unit, values: [] };
      entry.values.push(value);
      series.set(e.exerciseId, entry);
    }
  }

  const result: ExerciseProgress[] = [];
  for (const [exerciseId, { unit, values }] of series) {
    if (values.length < 2) continue;
    const first = values[0];
    const latest = values[values.length - 1];
    const gain = latest - first;
    result.push({ exerciseId, unit, values, first, latest, gain, gainPct: first > 0 ? gain / first : 0 });
  }
  return result.sort((a, b) => b.gainPct - a.gainPct);
}

// Sessions where an exercise beat every earlier session of that exercise.
export function recordsBroken(history: Workout[]): number {
  return exerciseProgress(history).reduce((count, p) => {
    let best = p.values[0];
    for (const v of p.values.slice(1)) {
      if (v > best) {
        count++;
        best = v;
      }
    }
    return count;
  }, 0);
}
