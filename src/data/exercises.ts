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
  { id: 'incline-bench-press', name: 'Press inclinado con barra', muscle: 'Pecho', equipment: 'Barra' },
  { id: 'decline-bench-press', name: 'Press declinado con barra', muscle: 'Pecho', equipment: 'Barra' },
  { id: 'db-bench-press', name: 'Press de banca con mancuernas', muscle: 'Pecho', equipment: 'Mancuernas' },
  { id: 'db-fly', name: 'Aperturas con mancuernas', muscle: 'Pecho', equipment: 'Mancuernas' },
  { id: 'cable-crossover', name: 'Cruce de poleas', muscle: 'Pecho', equipment: 'Polea' },
  { id: 'machine-chest-press', name: 'Press de pecho en máquina', muscle: 'Pecho', equipment: 'Máquina' },

  { id: 'deadlift', name: 'Peso muerto', muscle: 'Espalda', equipment: 'Barra' },
  { id: 'pull-up', name: 'Dominadas', muscle: 'Espalda', equipment: 'Peso corporal' },
  { id: 'barbell-row', name: 'Remo con barra', muscle: 'Espalda', equipment: 'Barra' },
  { id: 'lat-pulldown', name: 'Jalón al pecho', muscle: 'Espalda', equipment: 'Polea' },
  { id: 'seated-row', name: 'Remo sentado en polea', muscle: 'Espalda', equipment: 'Polea' },
  { id: 'db-row', name: 'Remo con mancuerna', muscle: 'Espalda', equipment: 'Mancuernas' },
  { id: 't-bar-row', name: 'Remo en T', muscle: 'Espalda', equipment: 'Barra' },
  { id: 'chin-up', name: 'Dominadas supinas', muscle: 'Espalda', equipment: 'Peso corporal' },
  { id: 'machine-row', name: 'Remo en máquina', muscle: 'Espalda', equipment: 'Máquina' },
  { id: 'straight-arm-pulldown', name: 'Pullover en polea con brazos rectos', muscle: 'Espalda', equipment: 'Polea' },
  { id: 'back-extension', name: 'Hiperextensiones lumbares', muscle: 'Espalda', equipment: 'Peso corporal' },
  { id: 'db-shrug', name: 'Encogimientos de hombros con mancuernas', muscle: 'Espalda', equipment: 'Mancuernas' },

  { id: 'squat', name: 'Sentadilla', muscle: 'Piernas', equipment: 'Barra' },
  { id: 'leg-press', name: 'Prensa de piernas', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'romanian-deadlift', name: 'Peso muerto rumano', muscle: 'Piernas', equipment: 'Barra' },
  { id: 'lunges', name: 'Zancadas', muscle: 'Piernas', equipment: 'Mancuernas' },
  { id: 'leg-curl', name: 'Curl femoral', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'leg-extension', name: 'Extensión de cuádriceps', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'Piernas', equipment: 'Barra' },
  { id: 'calf-raise', name: 'Elevación de gemelos', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'front-squat', name: 'Sentadilla frontal', muscle: 'Piernas', equipment: 'Barra' },
  { id: 'goblet-squat', name: 'Sentadilla goblet', muscle: 'Piernas', equipment: 'Kettlebell' },
  { id: 'bulgarian-split-squat', name: 'Sentadilla búlgara', muscle: 'Piernas', equipment: 'Mancuernas' },
  { id: 'hack-squat', name: 'Sentadilla hack', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'sumo-deadlift', name: 'Peso muerto sumo', muscle: 'Piernas', equipment: 'Barra' },
  { id: 'glute-bridge', name: 'Puente de glúteos', muscle: 'Piernas', equipment: 'Peso corporal' },
  { id: 'kettlebell-swing', name: 'Swing con kettlebell', muscle: 'Piernas', equipment: 'Kettlebell' },
  { id: 'hip-abduction', name: 'Abducción de cadera en máquina', muscle: 'Piernas', equipment: 'Máquina' },
  { id: 'seated-calf-raise', name: 'Elevación de gemelos sentado', muscle: 'Piernas', equipment: 'Máquina' },

  { id: 'overhead-press', name: 'Press militar', muscle: 'Hombros', equipment: 'Barra' },
  { id: 'lateral-raise', name: 'Elevaciones laterales', muscle: 'Hombros', equipment: 'Mancuernas' },
  { id: 'face-pull', name: 'Face pull', muscle: 'Hombros', equipment: 'Polea' },
  { id: 'arnold-press', name: 'Press Arnold', muscle: 'Hombros', equipment: 'Mancuernas' },
  { id: 'db-shoulder-press', name: 'Press de hombros con mancuernas', muscle: 'Hombros', equipment: 'Mancuernas' },
  { id: 'front-raise', name: 'Elevaciones frontales', muscle: 'Hombros', equipment: 'Mancuernas' },
  { id: 'reverse-fly', name: 'Pájaros (aperturas invertidas)', muscle: 'Hombros', equipment: 'Mancuernas' },
  { id: 'cable-lateral-raise', name: 'Elevación lateral en polea', muscle: 'Hombros', equipment: 'Polea' },
  { id: 'upright-row', name: 'Remo al mentón', muscle: 'Hombros', equipment: 'Barra' },
  { id: 'band-pull-apart', name: 'Aperturas con banda', muscle: 'Hombros', equipment: 'Banda' },

  { id: 'barbell-curl', name: 'Curl con barra', muscle: 'Bíceps', equipment: 'Barra' },
  { id: 'hammer-curl', name: 'Curl martillo', muscle: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'preacher-curl', name: 'Curl predicador', muscle: 'Bíceps', equipment: 'Máquina' },
  { id: 'db-curl', name: 'Curl con mancuernas', muscle: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'ez-bar-curl', name: 'Curl con barra Z', muscle: 'Bíceps', equipment: 'Barra' },
  { id: 'incline-db-curl', name: 'Curl inclinado con mancuernas', muscle: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'concentration-curl', name: 'Curl concentrado', muscle: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'cable-curl', name: 'Curl en polea', muscle: 'Bíceps', equipment: 'Polea' },

  { id: 'triceps-pushdown', name: 'Extensión de tríceps en polea', muscle: 'Tríceps', equipment: 'Polea' },
  { id: 'skull-crusher', name: 'Press francés', muscle: 'Tríceps', equipment: 'Barra' },
  { id: 'overhead-triceps', name: 'Extensión de tríceps sobre la cabeza', muscle: 'Tríceps', equipment: 'Mancuernas' },
  { id: 'close-grip-bench-press', name: 'Press de banca con agarre cerrado', muscle: 'Tríceps', equipment: 'Barra' },
  { id: 'rope-pushdown', name: 'Extensión de tríceps con cuerda', muscle: 'Tríceps', equipment: 'Polea' },
  { id: 'triceps-kickback', name: 'Patada de tríceps', muscle: 'Tríceps', equipment: 'Mancuernas' },
  { id: 'bench-dips', name: 'Fondos en banco', muscle: 'Tríceps', equipment: 'Peso corporal' },
  { id: 'diamond-push-up', name: 'Flexiones diamante', muscle: 'Tríceps', equipment: 'Peso corporal' },

  { id: 'plank', name: 'Plancha (segundos)', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'crunch', name: 'Abdominales', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'hanging-leg-raise', name: 'Elevación de piernas colgado', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'russian-twist', name: 'Giros rusos', muscle: 'Core', equipment: 'Disco' },
  { id: 'side-plank', name: 'Plancha lateral (segundos)', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'lying-leg-raise', name: 'Elevación de piernas tumbado', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'ab-wheel', name: 'Rueda abdominal', muscle: 'Core', equipment: 'Rueda' },
  { id: 'cable-crunch', name: 'Crunch en polea', muscle: 'Core', equipment: 'Polea' },
  { id: 'mountain-climber', name: 'Escaladores', muscle: 'Core', equipment: 'Peso corporal' },
  { id: 'pallof-press', name: 'Press Pallof', muscle: 'Core', equipment: 'Banda' },
];

// Equipment options offered when the user creates an exercise.
export const EQUIPMENT_OPTIONS = [
  'Barra',
  'Mancuernas',
  'Máquina',
  'Polea',
  'Peso corporal',
  'Kettlebell',
  'Disco',
  'Banda',
];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

// User-created exercises, mirrored here by GymProvider (see setCustomExercises)
// so every screen can keep calling the static getExercise().
let customList: Exercise[] = [];
let customById = new Map<string, Exercise>();

export function setCustomExercises(list: Exercise[]): void {
  if (list === customList) return;
  customList = list;
  customById = new Map(list.map((e) => [e.id, e]));
}

// Built-ins first, then custom ones (deleted custom exercises still resolve,
// so old workouts and routines keep their names).
export function getExercise(id: string): Exercise | undefined {
  return byId.get(id) ?? customById.get(id);
}

// Every exercise the user can pick: their own first, then the built-in catalog.
export function allExercises(): Exercise[] {
  return [...customList.filter((e) => !e.deleted), ...EXERCISES];
}

// Case- and spacing-insensitive name key, used to reject duplicate names.
export function nameKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
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
