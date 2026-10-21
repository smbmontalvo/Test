import type { Workout } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function toNumber(text: string): number {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function completedSets(w: Workout): number {
  return w.exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.done).length, 0);
}

export function workoutVolume(w: Workout): number {
  let total = 0;
  for (const e of w.exercises) {
    for (const s of e.sets) {
      if (s.done) total += toNumber(s.weight) * toNumber(s.reps);
    }
  }
  return Math.round(total);
}

export type PersonalRecord = { weight: number; reps: number; date: number };

// Heaviest completed set per exercise; ties on weight go to the set with more reps.
export function personalRecords(history: Workout[]): Record<string, PersonalRecord> {
  const prs: Record<string, PersonalRecord> = {};
  for (const w of history) {
    for (const e of w.exercises) {
      for (const s of e.sets) {
        if (!s.done) continue;
        const weight = toNumber(s.weight);
        const reps = toNumber(s.reps);
        const prev = prs[e.exerciseId];
        if (!prev || weight > prev.weight || (weight === prev.weight && reps > prev.reps)) {
          prs[e.exerciseId] = { weight, reps, date: w.startedAt };
        }
      }
    }
  }
  return prs;
}

// Monday 00:00 of the week containing ts. Uses calendar dates rather than
// fixed 24 h steps so daylight-saving changes don't shift the boundary.
export function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

// Days (0 = Monday) of the current week that have at least one workout.
export function trainedDaysThisWeek(history: Workout[], now = Date.now()): Set<number> {
  const weekStart = startOfWeek(now);
  const days = new Set<number>();
  for (const w of history) {
    if (w.startedAt >= weekStart) days.add((new Date(w.startedAt).getDay() + 6) % 7);
  }
  return days;
}

// Consecutive weeks with at least one workout. The current week counts if it
// already has one, but an empty current week doesn't break the streak yet.
export function weekStreak(history: Workout[], now = Date.now()): number {
  const weeks = new Set(history.map((w) => startOfWeek(w.startedAt)));
  let cursor = startOfWeek(now);
  if (!weeks.has(cursor)) cursor = startOfWeek(cursor - DAY_MS);
  let streak = 0;
  while (weeks.has(cursor)) {
    streak++;
    cursor = startOfWeek(cursor - DAY_MS);
  }
  return streak;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatLongDate(ts: number): string {
  const d = new Date(ts);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
}

// "Hoy", "Ayer", "Hace 3 días", or the date for anything older than a week.
export function formatRelativeDay(ts: number, now = Date.now()): string {
  const startOfDay = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / DAY_MS);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return formatDate(ts);
}

export function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function greeting(now = Date.now()): string {
  const h = new Date(now).getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function formatWeight(n: number): string {
  return String(n).replace('.', ',');
}

export function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
