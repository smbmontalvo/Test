import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { showAlert } from '../../components/Dialog';
import {
  bestSetIndex,
  capitalize,
  doneSets,
  formatTime,
  plural,
  recordsByWorkout,
  relativeAgo,
  shortWorkoutName,
  totalReps,
  workoutDuration,
  workoutMuscles,
} from '../../components/history/historyUtils';
import { MuscleTags, PrPill } from '../../components/history/parts';
import { Button, Card, EmptyState } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useToday } from '../../hooks/useToday';
import { useGym } from '../../store/GymContext';
import { colors, muscleColors, radius, spacing } from '../../theme';
import type { WorkoutExercise } from '../../types';
import {
  completedSets,
  formatDuration,
  formatLongDate,
  formatNumber,
  formatWeight,
  toNumber,
  workoutVolume,
} from '../../utils/stats';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history, deleteWorkout } = useGym();
  const now = useToday();
  const records = useMemo(() => recordsByWorkout(history), [history]);
  const workout = history.find((w) => w.id === id);

  if (!workout) {
    return <EmptyState icon="alert-circle-outline" title="Entrenamiento no encontrado" text="Puede que se haya eliminado." />;
  }

  const prs = records.get(workout.id) ?? new Set<string>();
  const volume = workoutVolume(workout);
  const exercises = workout.exercises.filter((e) => doneSets(e.sets).length > 0);
  const prNames = [...prs].map((exId) => getExercise(exId)?.name ?? exId);
  const timeRange = workout.finishedAt
    ? `${formatTime(workout.startedAt)} – ${formatTime(workout.finishedAt)}`
    : formatTime(workout.startedAt);

  const confirmDelete = () => {
    showAlert(
      'Eliminar entrenamiento',
      `Se borrará «${workout.name}» del ${formatLongDate(workout.startedAt)}. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            router.back();
            deleteWorkout(workout.id);
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroEyebrowRow}>
          <Ionicons name="calendar" size={16} color={colors.primaryText} />
          <Text style={styles.heroEyebrow}>{relativeAgo(workout.startedAt, now)}</Text>
        </View>
        <Text style={styles.heroTitle} accessibilityRole="header">
          {shortWorkoutName(workout.name)}
        </Text>
        <Text style={styles.heroMeta}>
          {capitalize(formatLongDate(workout.startedAt))} · {timeRange}
        </Text>

        <View style={styles.tiles}>
          <Tile icon="time-outline" label="Duración" value={formatDuration(workoutDuration(workout))} />
          <Tile icon="layers-outline" label="Series" value={String(completedSets(workout))} />
          {volume > 0 ? (
            <Tile icon="barbell-outline" label="Volumen" value={`${formatNumber(volume)} kg`} spoken={`${formatNumber(volume)} kilos`} />
          ) : (
            <Tile icon="repeat-outline" label="Repeticiones" value={formatNumber(totalReps(workout))} />
          )}
        </View>
      </View>

      <MuscleTags muscles={workoutMuscles(workout)} variant="chips" />

      {prs.size > 0 && (
        <View style={styles.prBanner} accessible>
          <View style={styles.prBannerIcon}>
            <Ionicons name="trophy" size={18} color={colors.primaryText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prBannerTitle}>
              {prs.size === 1 ? '¡Nuevo récord personal!' : `¡${prs.size} récords personales!`}
            </Text>
            <Text style={styles.prBannerText}>Superaste tu mejor marca en {joinNames(prNames)}.</Text>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader} accessible accessibilityRole="header">
        <Text style={styles.sectionTitle}>Ejercicios</Text>
        <Text style={styles.sectionMeta}>{plural(exercises.length, 'ejercicio', 'ejercicios')}</Text>
      </View>

      {exercises.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No se completó ninguna serie en este entrenamiento.</Text>
        </Card>
      ) : (
        exercises.map((e, i) => <ExerciseCard key={`${e.exerciseId}-${i}`} entry={e} isPr={prs.has(e.exerciseId)} />)
      )}

      <Button
        title="Eliminar entrenamiento"
        icon="trash-outline"
        variant="danger"
        onPress={confirmDelete}
        style={styles.delete}
      />
    </ScrollView>
  );
}

function Tile({ icon, label, value, spoken }: { icon: IconName; label: string; value: string; spoken?: string }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${spoken ?? value}`}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function ExerciseCard({ entry, isPr }: { entry: WorkoutExercise; isPr: boolean }) {
  const exercise = getExercise(entry.exerciseId);
  const sets = doneSets(entry.sets);
  const bodyweight = sets.every((s) => toNumber(s.weight) === 0);
  const best = sets.length > 1 ? bestSetIndex(sets) : -1;

  return (
    <Card style={styles.exercise}>
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1, gap: 2 }}>
          {exercise && (
            <View style={styles.exerciseTagRow}>
              <View style={[styles.dot, { backgroundColor: muscleColors[exercise.muscle] }]} />
              <Text style={styles.exerciseTag}>
                {exercise.muscle} · {exercise.equipment}
              </Text>
            </View>
          )}
          <Text style={styles.exerciseName}>{exercise?.name ?? entry.exerciseId}</Text>
        </View>
        {isPr && <PrPill accessibilityLabel="Nuevo récord personal en este ejercicio" />}
      </View>

      <View>
        <View style={styles.tableHead} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={[styles.headCell, styles.colSet]}>Serie</Text>
          {!bodyweight && <Text style={[styles.headCell, styles.colNum]}>Kg</Text>}
          <Text style={[styles.headCell, styles.colNum]}>Reps</Text>
          <View style={styles.colTag} />
        </View>

        {sets.map((s, i) => {
          const weight = toNumber(s.weight);
          const reps = toNumber(s.reps);
          const isBest = i === best;
          return (
            <View
              key={i}
              style={[styles.tableRow, i > 0 && styles.tableRowBorder, isBest && styles.tableRowBest]}
              accessible
              accessibilityLabel={`Serie ${i + 1}: ${weight > 0 ? `${formatWeight(weight)} kilos` : 'peso corporal'}, ${plural(
                reps,
                'repetición',
                'repeticiones',
              )}${isBest ? '. Mejor serie' : ''}`}
            >
              <View style={styles.colSet}>
                <View style={[styles.setBadge, isBest && styles.setBadgeBest]}>
                  <Text style={styles.setBadgeText}>{i + 1}</Text>
                </View>
              </View>
              {!bodyweight && (
                <Text style={[styles.cell, styles.colNum, weight === 0 && styles.cellMuted]}>
                  {weight > 0 ? formatWeight(weight) : '—'}
                </Text>
              )}
              <Text style={[styles.cell, styles.colNum]}>{reps}</Text>
              <View style={styles.colTag}>
                {isBest && (
                  <View style={styles.bestTag}>
                    <Ionicons name="star" size={12} color={colors.accent} />
                    <Text style={styles.bestTagText}>Mejor</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {bodyweight && exercise?.equipment !== 'Peso corporal' && <Text style={styles.footnote}>Sin peso añadido</Text>}
    </Card>
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48, gap: spacing.md },

  hero: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrow: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: { color: colors.primaryText, fontSize: 28, fontWeight: '800', letterSpacing: -0.4, marginTop: spacing.xs },
  heroMeta: { color: colors.primaryText, fontSize: 15, fontWeight: '600', opacity: 0.8 },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  tileValue: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  tileLabel: { color: colors.muted, fontSize: 13 },

  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    padding: spacing.md,
  },
  prBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prBannerTitle: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  prBannerText: { color: colors.text, fontSize: 14, marginTop: 2, lineHeight: 19 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: colors.muted, fontSize: 13, fontWeight: '600' },

  exercise: { gap: spacing.md, borderRadius: 20 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  exerciseTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  exerciseTag: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  exerciseName: { color: colors.text, fontSize: 17, fontWeight: '800' },

  tableHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingBottom: spacing.xs },
  headCell: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  tableRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  tableRowBest: { backgroundColor: colors.accentSoft, borderTopColor: 'transparent' },
  colSet: { width: 60 },
  colNum: { flex: 1 },
  colTag: { width: 72, alignItems: 'flex-end' },
  setBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBadgeBest: { backgroundColor: colors.primary },
  setBadgeText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  cell: { color: colors.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cellMuted: { color: colors.muted },
  bestTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bestTagText: { color: colors.accent, fontSize: 13, fontWeight: '800' },
  footnote: { color: colors.muted, fontSize: 13 },

  emptyText: { color: colors.muted, fontSize: 15 },
  delete: { alignSelf: 'center', marginTop: spacing.xl },
});
