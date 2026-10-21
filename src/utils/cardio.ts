import { getCardioActivity } from '../data/cardio';
import type { CardioSession } from '../types';
import { startOfWeek } from './stats';

export type CardioWeek = {
  minutes: number;
  km: number;
  sessions: number;
  // Minutes per weekday, 0 = Monday.
  perDay: number[];
  activeDays: number;
};

export function cardioWeek(sessions: CardioSession[], now = Date.now()): CardioWeek {
  const weekStart = startOfWeek(now);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const weekEnd = nextWeek.getTime();
  const perDay = [0, 0, 0, 0, 0, 0, 0];
  let minutes = 0;
  let km = 0;
  let count = 0;
  for (const s of sessions) {
    if (s.date < weekStart || s.date >= weekEnd) continue;
    perDay[(new Date(s.date).getDay() + 6) % 7] += s.minutes;
    minutes += s.minutes;
    km += s.distanceKm ?? 0;
    count++;
  }
  return { minutes, km, sessions: count, perDay, activeDays: perDay.filter((m) => m > 0).length };
}

export function formatKm(km: number): string {
  return (Math.round(km * 10) / 10).toString().replace('.', ',');
}

// Pace or speed in the units people use for each activity, e.g. "5:46 /km".
export function cardioSpeed(s: CardioSession): string | null {
  if (!s.distanceKm || s.distanceKm <= 0 || s.minutes <= 0) return null;
  const kind = getCardioActivity(s.type).speed;
  const clock = (totalMinutes: number) => {
    const sec = Math.round(totalMinutes * 60);
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  };
  if (kind === 'pace') return `${clock(s.minutes / s.distanceKm)} /km`;
  if (kind === 'per100m') return `${clock(s.minutes / (s.distanceKm * 10))} /100 m`;
  if (kind === 'kmh') return `${formatKm(s.distanceKm / (s.minutes / 60))} km/h`;
  return null;
}
