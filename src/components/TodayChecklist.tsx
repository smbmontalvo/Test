import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getExercise } from '../data/exercises';
import { buildExercise } from '../store/GymContext';
import { colors, radius, spacing } from '../theme';
import type { Routine, Workout, WorkoutExercise } from '../types';
import { formatWeight, toNumber } from '../utils/stats';

function setSummary(e: WorkoutExercise): string {
  const n = e.sets.length;
  const reps = e.sets[0]?.reps;
  if (!reps) return `${n} series`;
  const weight = Math.max(...e.sets.map((s) => toNumber(s.weight)));
  return weight > 0 ? `${n} × ${reps} · ${formatWeight(weight)} kg` : `${n} × ${reps} reps`;
}

// Today's planned routine as a checklist: one "Listo" per exercise, using the
// weights from last time. The workout saves itself when everything is done.
export function TodayChecklist({
  routine,
  dayName,
  workout,
  history,
  onToggle,
  onOpenExercise,
}: {
  routine: Routine;
  dayName: string;
  workout?: Workout;
  history: Workout[];
  onToggle: (exerciseId: string, done: boolean) => void;
  onOpenExercise: () => void;
}) {
  const exercises = workout?.exercises ?? routine.exerciseIds.map((id) => buildExercise(history, id));
  const isDone = (e: WorkoutExercise) => e.sets.length > 0 && e.sets.every((s) => s.done);
  const doneCount = exercises.filter(isDone).length;

  return (
    <View style={styles.card}>
      <View style={styles.eyebrowRow}>
        <Ionicons name="calendar" size={16} color={colors.primaryText} />
        <Text style={styles.eyebrow}>Hoy toca · {dayName}</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {routine.name}
      </Text>

      <View
        style={styles.progressRow}
        accessible
        accessibilityLabel={`${doneCount} de ${exercises.length} ejercicios listos`}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${exercises.length ? (doneCount / exercises.length) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {doneCount} de {exercises.length} listos
        </Text>
      </View>

      <View style={styles.list}>
        {exercises.map((e, i) => {
          const done = isDone(e);
          const name = getExercise(e.exerciseId)?.name ?? e.exerciseId;
          return (
            <View key={e.exerciseId} style={[styles.row, i > 0 && styles.rowDivider]}>
              <Pressable
                onPress={onOpenExercise}
                style={styles.rowText}
                accessibilityRole="button"
                accessibilityLabel={`${name}, ${setSummary(e)}`}
                accessibilityHint="Abre el entrenamiento para cambiar pesos o repeticiones"
              >
                <Text style={[styles.name, done && styles.nameDone]}>{name}</Text>
                <Text style={styles.summary}>{setSummary(e)}</Text>
              </Pressable>
              <Pressable
                onPress={() => onToggle(e.exerciseId, !done)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={`${name} listo`}
                style={({ pressed }) => [styles.ready, done && styles.readyDone, pressed && { opacity: 0.7 }]}
              >
                {done && <Ionicons name="checkmark" size={16} color={colors.card} />}
                <Text style={[styles.readyText, done && styles.readyTextDone]}>Listo</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>Al marcar el último ejercicio, el entrenamiento se guarda solo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm },
  eyebrow: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    paddingHorizontal: spacing.sm,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm },
  track: { flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: 'rgba(20,22,27,0.15)' },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primaryText },
  progressText: { color: colors.primaryText, fontSize: 14, fontWeight: '700' },
  list: { backgroundColor: colors.card, borderRadius: radius.lg, marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, paddingVertical: spacing.md },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowText: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  nameDone: { color: colors.muted },
  summary: { color: colors.muted, fontSize: 14, marginTop: 2, fontVariant: ['tabular-nums'] },
  ready: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  readyDone: { backgroundColor: colors.accent },
  readyText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  readyTextDone: { color: colors.card },
  hint: { color: colors.primaryText, fontSize: 13, opacity: 0.75, paddingHorizontal: spacing.sm, marginTop: spacing.xs },
});
