import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { DEFAULT_ROUTINES } from '../data/exercises';
import { colors } from '../theme';
import type { GymState, Profile, Routine, SetEntry, Workout, WorkoutExercise } from '../types';
import { newId } from '../utils/stats';

const STORAGE_KEY = 'gymapp:state:v1';
const DEFAULT_SETS = 3;

const initialState: GymState = {
  profile: { name: '', alias: '' },
  routines: DEFAULT_ROUTINES,
  history: [],
  active: null,
};

type GymContextValue = GymState & {
  updateProfile: (patch: Partial<Profile>) => void;
  createRoutine: (name: string) => string;
  updateRoutine: (id: string, patch: Partial<Omit<Routine, 'id'>>) => void;
  deleteRoutine: (id: string) => void;
  startWorkout: (routineId: string) => void;
  updateActive: (fn: (w: Workout) => Workout) => void;
  addExerciseToActive: (exerciseId: string) => void;
  finishWorkout: () => Workout | null;
  setExerciseDone: (routineId: string, exerciseId: string, done: boolean) => void;
  discardWorkout: () => void;
  deleteWorkout: (id: string) => void;
};

const GymContext = createContext<GymContextValue | null>(null);

// Pre-fill a new exercise with the completed sets from the last time it was
// trained, so the user only has to confirm or tweak the numbers.
export function buildExercise(history: Workout[], exerciseId: string): WorkoutExercise {
  for (const w of history) {
    const prev = w.exercises.find((e) => e.exerciseId === exerciseId);
    const done = prev?.sets.filter((s) => s.done) ?? [];
    if (done.length > 0) {
      return { exerciseId, sets: done.map((s) => ({ weight: s.weight, reps: s.reps, done: false })) };
    }
  }
  const empty: SetEntry = { weight: '', reps: '', done: false };
  return { exerciseId, sets: Array.from({ length: DEFAULT_SETS }, () => ({ ...empty })) };
}

// Data saved before routines had weekdays: give the built-in routines their default days.
function withDefaultDays(state: GymState): GymState {
  const defaults = new Map(DEFAULT_ROUTINES.map((r) => [r.id, r.days]));
  return {
    ...state,
    routines: state.routines.map((r) => (r.days === undefined && defaults.has(r.id) ? { ...r, days: defaults.get(r.id) } : r)),
  };
}

// Keep only completed sets and stamp the finish time.
function finalize(w: Workout): Workout {
  return {
    ...w,
    finishedAt: Date.now(),
    exercises: w.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((set) => set.done) }))
      .filter((e) => e.sets.length > 0),
  };
}

export function GymProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GymState>(initialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState(withDefaultDays({ ...initialState, ...(JSON.parse(raw) as Partial<GymState>) }));
      })
      .catch((err) => console.warn('No se pudieron cargar los datos', err))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) =>
      console.warn('No se pudieron guardar los datos', err),
    );
  }, [state, loaded]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const createRoutine = useCallback((name: string) => {
    const id = newId();
    setState((s) => ({ ...s, routines: [...s.routines, { id, name, exerciseIds: [] }] }));
    return id;
  }, []);

  const updateRoutine = useCallback((id: string, patch: Partial<Omit<Routine, 'id'>>) => {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setState((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) }));
  }, []);

  const startWorkout = useCallback((routineId: string) => {
    setState((s) => {
      const routine = s.routines.find((r) => r.id === routineId);
      if (!routine) return s;
      const active: Workout = {
        id: newId(),
        name: routine.name,
        routineId: routine.id,
        startedAt: Date.now(),
        exercises: routine.exerciseIds.map((id) => buildExercise(s.history, id)),
      };
      return { ...s, active };
    });
  }, []);

  const updateActive = useCallback((fn: (w: Workout) => Workout) => {
    setState((s) => (s.active ? { ...s, active: fn(s.active) } : s));
  }, []);

  const addExerciseToActive = useCallback((exerciseId: string) => {
    setState((s) =>
      s.active
        ? {
            ...s,
            active: { ...s.active, exercises: [...s.active.exercises, buildExercise(s.history, exerciseId)] },
          }
        : s,
    );
  }, []);

  const finishWorkout = useCallback(() => {
    if (!state.active) return null;
    const finished = finalize(state.active);
    setState((s) => ({ ...s, active: null, history: [finished, ...s.history] }));
    return finished;
  }, [state.active]);

  // Quick logging from the home checklist: marks every set of one exercise.
  // Starts the routine's workout on first use and saves it once all are done.
  const setExerciseDone = useCallback((routineId: string, exerciseId: string, done: boolean) => {
    setState((s) => {
      const routine = s.routines.find((r) => r.id === routineId);
      if (!routine) return s;
      if (s.active && s.active.routineId !== routineId) return s;
      const base: Workout = s.active ?? {
        id: newId(),
        name: routine.name,
        routineId,
        startedAt: Date.now(),
        exercises: routine.exerciseIds.map((id) => buildExercise(s.history, id)),
      };
      const next: Workout = {
        ...base,
        exercises: base.exercises.map((e) =>
          e.exerciseId === exerciseId ? { ...e, sets: e.sets.map((set) => ({ ...set, done })) } : e,
        ),
      };
      const allDone = next.exercises.length > 0 && next.exercises.every((e) => e.sets.every((set) => set.done));
      return allDone ? { ...s, active: null, history: [finalize(next), ...s.history] } : { ...s, active: next };
    });
  }, []);

  const discardWorkout = useCallback(() => {
    setState((s) => ({ ...s, active: null }));
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setState((s) => ({ ...s, history: s.history.filter((w) => w.id !== id) }));
  }, []);

  const value = useMemo<GymContextValue>(
    () => ({
      ...state,
      updateProfile,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      startWorkout,
      updateActive,
      addExerciseToActive,
      finishWorkout,
      setExerciseDone,
      discardWorkout,
      deleteWorkout,
    }),
    [
      state,
      updateProfile,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      startWorkout,
      updateActive,
      addExerciseToActive,
      finishWorkout,
      setExerciseDone,
      discardWorkout,
      deleteWorkout,
    ],
  );

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym(): GymContextValue {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error('useGym debe usarse dentro de <GymProvider>');
  return ctx;
}
