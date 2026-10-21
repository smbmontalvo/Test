import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { TickBar } from '../components/TickBar';
import { Button, Card } from '../components/ui';
import { getExercise } from '../data/exercises';
import { useGym } from '../store/GymContext';
import { colors, muscleColors, radius, spacing } from '../theme';
import { exerciseProgress, recordsBroken, type ExerciseProgress } from '../utils/progress';
import { hasSchedule, todayPlan } from '../utils/schedule';
import { formatLongDate, formatNumber, formatWeight, weekStreak, workoutVolume } from '../utils/stats';

type IconName = ComponentProps<typeof Ionicons>['name'];

const HARD_DAY_TIPS: { icon: IconName; text: string }[] = [
  { icon: 'timer-outline', text: 'Haz una versión corta. 20 minutos también cuentan y mantienen el hábito.' },
  { icon: 'trending-up', text: 'El progreso no es una línea recta. Una semana floja no borra lo que ya construiste.' },
  { icon: 'bed-outline', text: 'Si estás cansado, descansar bien también es parte del entrenamiento.' },
];

const unitLabel = (p: ExerciseProgress, v: number) => (p.unit === 'kg' ? `${formatWeight(v)} kg` : `${v} reps`);

export default function EncouragementScreen() {
  const { history, routines } = useGym();
  const today = todayPlan(routines, history);
  const pendingToday = today.routine && !today.done ? today.routine : undefined;

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
        {pendingToday ? (
          <Button title={`Ir a ${pendingToday.name} de hoy`} icon="play" size="lg" onPress={() => router.back()} />
        ) : !hasSchedule(routines) ? (
          <Button title="Programar mi semana" icon="calendar" size="lg" onPress={() => router.push('/rutinas')} />
        ) : null}
      </ScrollView>
    );
  }

  const progress = exerciseProgress(history);
  const improved = progress.filter((p) => p.gain > 0);
  const top = improved[0];
  // One shared scale for all bars: the track is the top gain rounded up to the next 25%.
  const scaleMax = top ? Math.max(0.25, Math.ceil(top.gainPct / 0.25) * 0.25) : 0.25;
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
          <Text style={styles.sectionHint}>Cuánto ha subido tu mejor serie desde el primer día.</Text>
          <Card style={{ gap: spacing.xl }}>
            {improved.slice(0, 4).map((p, i) => {
              const exercise = getExercise(p.exerciseId);
              return (
                <TickBar
                  key={p.exerciseId}
                  fraction={p.gainPct / scaleMax}
                  percent={Math.round(p.gainPct * 100)}
                  color={exercise ? muscleColors[exercise.muscle] : colors.accent}
                  label={exercise?.name ?? p.exerciseId}
                  detail={`${exercise?.muscle ?? ''} · ${unitLabel(p, p.first)} → ${unitLabel(p, p.latest)}`}
                  delay={i * 180}
                />
              );
            })}
            <Text style={styles.scaleNote}>Barra completa = +{Math.round(scaleMax * 100)}% de mejora</Text>
          </Card>
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
        {pendingToday && (
          <Button
            title={`Ir a ${pendingToday.name} de hoy`}
            icon="play"
            size="lg"
            accessibilityLabel={`Volver a Inicio para hacer ${pendingToday.name}`}
            onPress={() => router.back()}
          />
        )}
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

  scaleNote: { color: colors.muted, fontSize: 12 },

  tip: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  tipText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 },

  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
