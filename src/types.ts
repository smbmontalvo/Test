export type MuscleGroup =
  | 'Pecho'
  | 'Espalda'
  | 'Piernas'
  | 'Hombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Core';

export type Exercise = {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: string;
};

export type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
  // Weekdays this routine is planned for, 0 = Monday … 6 = Sunday.
  days?: number[];
};

// Weight and reps are kept as the raw text the user typed so partial input
// like "62," survives re-renders; parse with toNumber() when calculating.
export type SetEntry = {
  weight: string;
  reps: string;
  done: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: SetEntry[];
};

export type Workout = {
  id: string;
  name: string;
  routineId?: string;
  startedAt: number;
  finishedAt?: number;
  exercises: WorkoutExercise[];
};

export type GymState = {
  routines: Routine[];
  history: Workout[];
  active: Workout | null;
};
