import type { Exercise, MuscleGroup, Routine } from '../types';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Pecho',
  'Espalda',
  'Piernas',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Core',
];

export const EXERCISES: Exercise[] = [
  { id: 'bench-press', name: 'Press de banca', muscle: 'Pecho', equipment: 'Barra' },
  { id: 'incline-db-press', name: 'Press inclinado con mancuernas', muscle: 'Pecho', equipment: 'Mancuernas' },
  { id: 'chest-fly', name: 'Aperturas en máquina', muscle: 'Pecho', equipment: 'Máquina' },
  { id: 'push-up', name: 'Flexiones', muscle: 'Pecho', equipment: 'Peso corporal' },
  { id: 'dips', name: 'Fondos en paralelas', muscle: 'Pecho', equipment: 'Peso corporal' },

  { id: 'deadlift', name: 'Peso muerto', muscle: 'Espalda', equipment: 'Barra' },
  { id: 'pull-up', name: 'Dominadas', muscle: 'Espalda', equipment: 'Peso corporal' },
  { id: 'barbell-row', name: 'Remo con barra', muscle: 'Espalda', equipment: 'Barra' },
  { id: 'lat-pulldown', name: 'Jalón al pecho', muscle: 'Espalda', equipment: 'Polea' },
  { id: 'seated-row', name: 'Remo sentado en polea', muscle: 'Espalda', equipment: 'Polea' },

  { id: 'squat', name: 'Sentadilla', muscle: 'Piernas', equipment: 'Barra' },
  { id: 'leg-press', name: 'Prensa de piernas', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'romanian-deadlift', name: 'Peso muerto rumano', muscle: 'Piernas', equipment: 'Barra' },
  { id: 'lunges', name: 'Zancadas', muscle: 'Piernas', equipment: 'Mancuernas' },
  { id: 'leg-curl', name: 'Curl femoral', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'leg-extension', name: 'Extensión de cuádriceps', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'Piernas', equipment: 'Barra' },
  { id: 'calf-raise', name: 'Elevación de gemelos', muscle: 'Piernas', equipment: 'Máquina' },

  { id: 'overhead-press', name: 'Press militar', muscle: 'Hombros', equipment: 'Barra' },
  { id: 'lateral-raise', name: 'Elevaciones laterales', muscle: 'Hombros', equipment: 'Mancuernas' },
  { id: 'face-pull', name: 'Face pull', muscle: 'Hombros', equipment: 'Polea' },
  { id: 'arnold-press', name: 'Press Arnold', muscle: 'Hombros', equipment: 'Mancuernas' },

  { id: 'barbell-curl', name: 'Curl con barra', muscle: 'Bíceps', equipment: 'Barra' },
  { id: 'hammer-curl', name: 'Curl martillo', muscle: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'preacher-curl', name: 'Curl predicador', muscle: 'Bíceps', equipment: 'Máquina' },

  { id: 'triceps-pushdown', name: 'Extensión de tríceps en polea', muscle: 'Tríceps', equipment: 'Polea' },
  { id: 'skull-crusher', name: 'Press francés', muscle: 'Tríceps', equipment: 'Barra' },
  { id: 'overhead-triceps', name: 'Extensión de tríceps sobre la cabeza', muscle: 'Tríceps', equipment: 'Mancuernas' },

  { id: 'plank', name: 'Plancha (segundos)', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'crunch', name: 'Abdominales', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'hanging-leg-raise', name: 'Elevación de piernas colgado', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'russian-twist', name: 'Giros rusos', muscle: 'Core', equipment: 'Disco' },
];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'default-push',
    name: 'Empuje (Pecho, Hombro, Tríceps)',
    exerciseIds: ['bench-press', 'incline-db-press', 'overhead-press', 'lateral-raise', 'triceps-pushdown'],
    days: [0, 3],
  },
  {
    id: 'default-pull',
    name: 'Tirón (Espalda, Bíceps)',
    exerciseIds: ['deadlift', 'pull-up', 'barbell-row', 'face-pull', 'barbell-curl'],
    days: [1, 4],
  },
  {
    id: 'default-legs',
    name: 'Pierna',
    exerciseIds: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'],
    days: [2, 5],
  },
];
