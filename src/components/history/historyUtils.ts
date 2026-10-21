import { getExercise, MUSCLE_GROUPS } from '../../data/exercises';
import type { MuscleGroup, SetEntry, Workout } from '../../types';
import { formatRelativeDay, toNumber } from '../../utils/stats';

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const workoutDuration = (w: Workout) => (w.finishedAt ?? w.startedAt) - w.startedAt;

export const doneSets = (sets: SetEntry[]) => sets.filter((s) => s.done);

export function totalReps(w: Workout): number {
  let reps = 0;
  for (const e of w.exercises) for (const s of doneSets(e.sets)) reps += toNumber(s.reps);
  return reps;
}

// Muscle groups trained, the one with most completed sets first.
export function workoutMuscles(w: Workout): MuscleGroup[] {
  const sets = new Map<MuscleGroup, number>();
  for (const e of w.exercises) {
    const muscle = getExercise(e.exerciseId)?.muscle;
    const n = doneSets(e.sets).length;
    if (muscle && n > 0) sets.set(muscle, (sets.get(muscle) ?? 0) + n);
  }
  return [...sets.keys()].sort(
    (a, b) => (sets.get(b) ?? 0) - (sets.get(a) ?? 0) || MUSCLE_GROUPS.indexOf(a) - MUSCLE_GROUPS.indexOf(b),
  );
}

// A session's best mark for one exercise: heaviest weight, or most reps when
// every set is bodyweight (0 kg). Same rule as the progress screen.
type Mark = { unit: 'kg' | 'reps'; value: number };

function sessionMark(sets: SetEntry[]): Mark | null {
  const done = doneSets(sets);
  if (done.length === 0) return null;
  const maxWeight = Math.max(...done.map((s) => toNumber(s.weight)));
  if (maxWeight > 0) return { unit: 'kg', value: maxWeight };
  return { unit: 'reps', value: Math.max(...done.map((s) => toNumber(s.reps))) };
}

// For every workout, the exercises where it beat all earlier sessions of that
// exercise. The first time an exercise is done doesn't count as a record.
export function recordsByWorkout(history: Workout[]): Map<string, Set<string>> {
  const best = new Map<string, Mark>();
  const result = new Map<string, Set<string>>();
  const oldestFirst = [...history].sort((a, b) => a.startedAt - b.startedAt);

  for (const w of oldestFirst) {
    // The same exercise may appear twice in one workout; merge its sets first.
    const byExercise = new Map<string, SetEntry[]>();
    for (const e of w.exercises) byExercise.set(e.exerciseId, [...(byExercise.get(e.exerciseId) ?? []), ...e.sets]);

    for (const [exerciseId, sets] of byExercise) {
      const mark = sessionMark(sets);
      if (!mark) continue;
      const prev = best.get(exerciseId);
      if (prev && prev.unit === mark.unit && mark.value > prev.value) {
        const set = result.get(w.id) ?? new Set<string>();
        set.add(exerciseId);
        result.set(w.id, set);
      }
      if (!prev || prev.unit !== mark.unit || mark.value > prev.value) best.set(exerciseId, mark);
    }
  }
  return result;
}

// Index of the best completed set: heaviest, ties broken by reps. -1 if none.
export function bestSetIndex(sets: SetEntry[]): number {
  let index = -1;
  let weight = -1;
  let reps = -1;
  sets.forEach((s, i) => {
    if (!s.done) return;
    const w = toNumber(s.weight);
    const r = toNumber(s.reps);
    if (w > weight || (w === weight && r > reps)) {
      index = i;
      weight = w;
      reps = r;
    }
  });
  return index;
}

// Routine names like "Empuje (Pecho, Hombro, Tríceps)" repeat the muscle
// tags shown next to them; drop the parenthesis only when it lists muscles.
export function shortWorkoutName(name: string): string {
  const match = /^(.*\S)\s*\(([^)]*)\)\s*$/.exec(name);
  if (!match) return name;
  const accents: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
  const norm = (s: string) => s.trim().toLowerCase().replace(/[áéíóú]/g, (c) => accents[c]);
  const parts = match[2].split(/,|\by\b/).map(norm).filter(Boolean);
  const muscles = MUSCLE_GROUPS.map(norm);
  const onlyMuscles = parts.length > 0 && parts.every((p) => muscles.some((m) => m.startsWith(p) || p.startsWith(m)));
  return onlyMuscles ? match[1] : name;
}

// Monday 00:00 of the week containing ts. Uses calendar days rather than
// fixed 24 h steps so weeks with a daylight-saving change stay in one group.
export function weekStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export type WeekLabel = { title: string; spoken: string };

// "Esta semana", "Semana pasada", or the Monday–Sunday range ("13 – 19 oct").
export function weekLabel(monday: number, now: number): WeekLabel {
  const current = weekStart(now);
  if (monday === current) return { title: 'Esta semana', spoken: 'Esta semana' };
  const previous = new Date(current);
  previous.setDate(previous.getDate() - 7);
  if (monday === previous.getTime()) return { title: 'Semana pasada', spoken: 'Semana pasada' };

  const start = new Date(monday);
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const year = end.getFullYear() !== new Date(now).getFullYear() ? ` ${end.getFullYear()}` : '';
  const from = sameMonth ? `${start.getDate()}` : `${start.getDate()} ${MONTHS[start.getMonth()]}`;
  const title = `${from} – ${end.getDate()} ${MONTHS[end.getMonth()]}${year}`;
  const spoken = `Semana del ${start.getDate()} de ${MONTHS_LONG[start.getMonth()]} al ${end.getDate()} de ${MONTHS_LONG[end.getMonth()]}${year}`;
  return { title, spoken };
}

// "Hoy", "Ayer", "Hace 3 días", "Hace 2 semanas", "Hace 4 meses".
export function relativeAgo(ts: number, now: number): string {
  const day = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const days = Math.round((day(now) - day(ts)) / DAY_MS);
  if (days < 7) return formatRelativeDay(ts, now);
  if (days < 60) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;
  }
  const months = Math.floor(days / 30);
  return months < 12 ? `Hace ${months} meses` : months < 24 ? 'Hace más de un año' : `Hace ${Math.floor(months / 12)} años`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
