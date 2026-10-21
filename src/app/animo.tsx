import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '../components/ui';
import { getExercise } from '../data/exercises';
import { useStartWorkout } from '../hooks/useStartWorkout';
import { useGym } from '../store/GymContext';
import { colors, radius, spacing } from '../theme';
import { exerciseProgress, nextRoutine, recordsBroken, type ExerciseProgress } from '../utils/progress';
import { formatLongDate, formatNumber, formatWeight, weekStreak, workoutVolume } from '../utils/stats';

type IconName = ComponentProps<typeof Ionicons>['name'];

const CHART_HEIGHT = 64;

const HARD_DAY_TIPS: { icon: IconName; text: string }[] = [
  { icon: 'timer-outline', text: 'Haz una versión corta. 20 minutos también cuentan y mantienen el hábito.' },
  { icon: 'trending-up', text: 'El progreso no es una línea recta. Una semana floja no borra lo que ya construiste.' },
  { icon: 'bed-outline', text: 'Si estás cansado, descansar bien también es parte del entrenamiento.' },
];

const unitLabel = (p: ExerciseProgress, v: number) => (p.unit === 'kg' ? `${formatWeight(v)} kg` : `${v} reps`);

export default function EncouragementScreen() {
  const { history, routines } = useGym();
  const startWorkout = useStartWorkout();
  const suggested = nextRoutine(routines, history);

  if (history.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Todo empieza por uno</Text>
          <Text style={styles.heroTitle}>El primer entrenamiento es el más difícil</Text>
          <Text style={styles.heroText}>
            Todavía no hay entrenamientos guardados. Cuando completes el primero, aquí verás cómo vas mejorando.
          </Text>
        </View>
        <Button title="Empezar mi primer entrenamiento" icon="play" size="lg" onPress={() => startWorkout(suggested?.id)} />
      </ScrollView>
    );
  }

  const progress = exerciseProgress(history);
  const improved = progress.filter((p) => p.gain > 0);
  const top = improved[0];
  const records = recordsBroken(history);
  const streak = weekStreak(history);
  const firstWorkout = history[history.length - 1];
  const totalKg = history.reduce((acc, w) => acc + workoutVolume(w), 0);
  const totalHours = history.reduce((acc, w) => acc + ((w.finishedAt ?? w.startedAt) - w.startedAt), 0) / 3600000;

  const headline = top
    ? `Hoy ${top.unit === 'kg' ? 'levantas' : 'haces'} ${unitLabel(top, top.gain)} más en ${getExercise(top.exerciseId)?.name.toLowerCase()} que tu primer día.`
    : `Ya llevas ${history.length} entrenamientos. Eso es constancia.`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero} accessible accessibilityRole="header">
        <Text style={styles.heroEyebrow}>Mira lo lejos que has llegado</Text>
        <Text style={styles.heroTitle}>{headline}</Text>
        <Text style={styles.heroText}>
          Desde el {formatLongDate(firstWorkout.startedAt).replace(/^\S+ /, '')}
          {streak > 1 ? `, y llevas ${streak} semanas seguidas sin fallar.` : '.'}
        </Text>
      </View>

      <View style={styles.totals}>
        <Total icon="checkmark-done" value={String(history.length)} label="sesiones completadas" />
        <Total icon="barbell-outline" value={formatNumber(totalKg)} label="kg levantados en total" />
        <Total icon="time-outline" value={totalHours.toFixed(1).replace('.', ',')} label="horas invertidas en ti" />
      </View>

      {records > 0 && (
        <Card style={styles.records}>
          <View style={styles.recordsIcon}>
            <Ionicons name="trophy" size={22} color={colors.accent} />
          </View>
          <Text style={styles.recordsText}>
            Has superado tu mejor marca <Text style={styles.strong}>{records} {records === 1 ? 'vez' : 'veces'}</Text>.
            Cada una fue un día en que hiciste algo que antes no podías.
          </Text>
        </Card>
      )}

      {improved.length > 0 && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            En lo que más has mejorado
          </Text>
          <Text style={styles.sectionHint}>Tu mejor serie en cada sesión, del primer día a hoy.</Text>
          <View style={{ gap: spacing.md }}>
            {improved.slice(0, 4).map((p) => (
              <ProgressCard key={p.exerciseId} progress={p} />
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Para los días difíciles
      </Text>
      <Card style={{ gap: spacing.lg }}>
        {HARD_DAY_TIPS.map((tip) => (
          <View key={tip.text} style={styles.tip}>
            <Ionicons name={tip.icon} size={22} color={colors.accent} />
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <Button
          title="Entrenar aunque sea un poco"
          icon="play"
          size="lg"
          accessibilityLabel={suggested ? `Empezar ${suggested.name}` : 'Empezar entrenamiento'}
          onPress={() => startWorkout(suggested?.id)}
        />
        <Button title="Volver al inicio" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

function Total({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <Card style={styles.total}>
      <View accessible accessibilityLabel={`${value} ${label}`}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={styles.totalValue}>{value}</Text>
        <Text style={styles.totalLabel}>{label}</Text>
      </View>
    </Card>
  );
}

function ProgressCard({ progress: p }: { progress: ExerciseProgress }) {
  const name = getExercise(p.exerciseId)?.name ?? p.exerciseId;
  const max = Math.max(...p.values);
  const pct = Math.round(p.gainPct * 100);

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.progressHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.progressName}>{name}</Text>
          <Text style={styles.progressRange}>
            {unitLabel(p, p.first)} <Text style={styles.arrow}>→</Text>{' '}
            <Text style={styles.strong}>{unitLabel(p, p.latest)}</Text>
          </Text>
        </View>
        <View style={styles.gainPill}>
          <Ionicons name="arrow-up" size={14} color={colors.accent} />
          <Text style={styles.gainText}>{pct}%</Text>
        </View>
      </View>

      {/* Bars grow from zero so the change is shown at its true size. */}
      <View
        style={styles.chart}
        accessible
        accessibilityLabel={`${name}, mejor serie por sesión: ${p.values.map((v) => unitLabel(p, v)).join(', ')}`}
      >
        {p.values.map((v, i) => (
          <View key={i} style={styles.barSlot}>
            <View style={[styles.bar, { height: Math.max(4, (v / max) * CHART_HEIGHT) }]} />
          </View>
        ))}
      </View>
      <View style={styles.chartAxis}>
        <Text style={styles.axisText}>Primer día</Text>
        <Text style={styles.axisText}>
          {p.values.length} {p.values.length === 1 ? 'sesión' : 'sesiones'}
        </Text>
        <Text style={styles.axisText}>Hoy</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },

  hero: {
    backgroundColor: colors.supportSoft,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  heroEyebrow: {
    color: colors.support,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: { color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 30, letterSpacing: -0.3 },
  heroText: { color: colors.text, fontSize: 16, lineHeight: 22, opacity: 0.8 },

  totals: { flexDirection: 'row', gap: spacing.sm },
  total: { flex: 1, padding: spacing.md },
  totalValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: spacing.xs },
  totalLabel: { color: colors.muted, fontSize: 13, lineHeight: 17 },

  records: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recordsIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordsText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 },
  strong: { fontWeight: '800', color: colors.text },

  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: spacing.lg },
  sectionHint: { color: colors.muted, fontSize: 14, marginTop: -spacing.xs },

  progressHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  progressName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  progressRange: { color: colors.muted, fontSize: 15, marginTop: 2, fontVariant: ['tabular-nums'] },
  arrow: { color: colors.muted },
  gainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gainText: { color: colors.accent, fontWeight: '800', fontSize: 14 },

  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    maxWidth: 24,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs },
  axisText: { color: colors.muted, fontSize: 12 },

  tip: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  tipText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 },

  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
