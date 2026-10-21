import { WEEK_DAYS, todayIndex } from '../components/DayPicker';
import type { Routine, Workout } from '../types';
import { isSameDay } from './stats';

export function routineForDay(routines: Routine[], day: number): Routine | undefined {
  return routines.find((r) => r.days?.includes(day));
}

export function hasSchedule(routines: Routine[]): boolean {
  return routines.some((r) => r.days && r.days.length > 0);
}

// Today's planned routine and the workout that completed it, if any.
export function todayPlan(routines: Routine[], history: Workout[], now = Date.now()) {
  const day = todayIndex(now);
  const routine = routineForDay(routines, day);
  const done = routine ? history.find((w) => w.routineId === routine.id && isSameDay(w.startedAt, now)) : undefined;
  return { day, routine, done };
}

// First routine planned after today, with a friendly "mañana" / "el jueves".
export function nextPlanned(routines: Routine[], today: number) {
  for (let k = 1; k <= 7; k++) {
    const day = (today + k) % 7;
    const routine = routineForDay(routines, day);
    if (routine) return { routine, when: k === 1 ? 'mañana' : `el ${WEEK_DAYS[day].long.toLowerCase()}` };
  }
  return undefined;
}
