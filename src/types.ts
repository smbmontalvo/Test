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
  // Created by the user (stored in GymState.customExercises, id "custom-…").
  custom?: true;
  // A custom exercise the user removed: hidden from lists but still resolvable
  // so old workouts keep showing its name.
  deleted?: true;
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

export type Profile = {
  name: string;
  alias: string;
  // Data URI of the profile photo, so it survives app restarts.
  photo?: string;
};

export type CardioType = 'run' | 'walk' | 'bike' | 'elliptical' | 'row' | 'swim' | 'hiit';

export type CardioSession = {
  id: string;
  type: CardioType;
  date: number;
  minutes: number;
  distanceKm?: number;
};

export type GymState = {
  profile: Profile;
  routines: Routine[];
  history: Workout[];
  active: Workout | null;
  customExercises: Exercise[];
  cardio: CardioSession[];
  // Weekly cardio target in minutes.
  cardioGoal: number;
};
