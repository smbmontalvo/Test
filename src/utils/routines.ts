import { getExercise } from '../data/exercises';
import type { MuscleGroup, Routine, Workout } from '../types';
import { formatDuration } from './stats';

// Muscle groups a routine trains, in exercise order.
export function routineMuscles(r: Routine, limit = 4): MuscleGroup[] {
  const seen: MuscleGroup[] = [];
  for (const id of r.exerciseIds) {
    const m = getExercise(id)?.muscle;
    if (m && !seen.includes(m)) seen.push(m);
  }
  return seen.slice(0, limit);
}

// "5 ejercicios · unos 1 h 11 min", using the average of past sessions.
export function plannedMeta(r: Routine, history: Workout[]): string {
  const past = history.filter((w) => w.routineId === r.id && w.finishedAt);
  const parts = [`${r.exerciseIds.length} ${r.exerciseIds.length === 1 ? 'ejercicio' : 'ejercicios'}`];
  if (past.length > 0) {
    const avg = past.reduce((acc, w) => acc + ((w.finishedAt ?? w.startedAt) - w.startedAt), 0) / past.length;
    parts.push(`unos ${formatDuration(avg)}`);
  }
  return parts.join(' · ');
}
