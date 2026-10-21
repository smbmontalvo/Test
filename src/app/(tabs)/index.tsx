import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useStartWorkout } from '../../hooks/useStartWorkout';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';
import type { Routine, Workout } from '../../types';
import { nextRoutine } from '../../utils/progress';
import {
  completedSets,
  formatDuration,
  formatLongDate,
  formatNumber,
  formatRelativeDay,
  formatWeight,
  greeting,
  startOfWeek,
  toNumber,
  trainedDaysThisWeek,
  weekStreak,
  workoutVolume,
} from '../../utils/stats';

type IconName = ComponentProps<typeof Ionicons>['name'];

const DAYS = [
  { short: 'L', long: 'Lunes' },
  { short: 'M', long: 'Martes' },
  { short: 'X', long: 'Miércoles' },
  { short: 'J', long: 'Jueves' },
  { short: 'V', long: 'Viernes' },
  { short: 'S', long: 'Sábado' },
  { short: 'D', long: 'Domingo' },
];

const duration = (w: Workout) => (w.finishedAt ?? w.startedAt) - w.startedAt;

function averageDuration(history: Workout[], routineId: string): number | null {
  const past = history.filter((w) => w.routineId === routineId && w.finishedAt);
  if (past.length === 0) return null;
  return past.reduce((acc, w) => acc + duration(w), 0) / past.length;
}

function bestSets(w: Workout, limit: number) {
  return w.exercises.slice(0, limit).map((e) => {
    const best = e.sets.reduce((a, b) => (toNumber(b.weight) > toNumber(a.weight) ? b : a), e.sets[0]);
    return { exerciseId: e.exerciseId, weight: toNumber(best.weight), reps: toNumber(best.reps) };
  });
}

export default function HomeScreen() {
  const { history, routines, active } = useGym();
  const startWorkout = useStartWorkout();
  const insets = useSafeAreaInsets();

  const suggested = nextRoutine(routines, history);
  const others = routines.filter((r) => r.id !== suggested?.id);

  const last = history[0];
  const previousSame = last?.routineId ? history.slice(1).find((w) => w.routineId === last.routineId) : undefined;
  const volumeChange =
    last && previousSame && workoutVolume(previousSame) > 0
      ? Math.round(((workoutVolume(last) - workoutVolume(previousSame)) / workoutVolume(previousSame)) * 100)
      : null;

  const weekStart = startOfWeek(Date.now());
  const thisWeek = history.filter((w) => w.startedAt >= weekStart);
  const weekVolume = thisWeek.reduce((acc, w) => acc + workoutVolume(w), 0);
  const trainedDays = trainedDaysThisWeek(history);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const streak = weekStreak(history);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View accessible accessibilityRole="header">
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.date}>{capitalize(formatLongDate(Date.now()))}</Text>
      </View>

      {active ? (
        <HeroCard
          eyebrow="Entrenamiento en curso"
          icon="flash"
          title={active.name}
          meta={`Empezaste hace ${formatDuration(Date.now() - active.startedAt)} · ${completedSets(active)} de ${active.exercises.reduce((n, e) => n + e.sets.length, 0)} series hechas`}
          action="Continuar entrenamiento"
          onPress={() => router.push('/entrenamiento')}
        />
      ) : suggested ? (
        <HeroCard
          eyebrow="Te toca hoy"
          icon="barbell"
          title={suggested.name}
          meta={routineMeta(suggested, history)}
          detail={suggested.exerciseIds
            .slice(0, 3)
            .map((id) => getExercise(id)?.name)
            .filter(Boolean)
            .join(' · ')}
          action="Empezar"
          actionLabel={`Empezar ${suggested.name}`}
          onPress={() => startWorkout(suggested.id)}
        />
      ) : null}

      <OptionRow
        icon="heart"
        title="Me estoy desanimando"
        subtitle="Mira todo lo que has mejorado"
        accessibilityLabel="Me estoy desanimando. Ver un resumen de cómo has mejorado"
        onPress={() => router.push('/animo')}
        tone="support"
      />

      <Text style={styles.sectionTitle} accessibilityRole="header">
        O elige otro
      </Text>
      <View style={styles.optionList}>
        {others.map((r) => (
          <OptionRow
            key={r.id}
            icon="play"
            title={r.name}
            subtitle={lastDoneText(r, history)}
            accessibilityLabel={`Empezar ${r.name}. ${lastDoneText(r, history)}`}
            onPress={() => startWorkout(r.id)}
          />
        ))}
        <OptionRow
          icon="add"
          title="Entrenamiento libre"
          subtitle="Sin rutina, añade ejercicios sobre la marcha"
          onPress={() => startWorkout()}
        />
      </View>

      {last && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Último entrenamiento
            </Text>
            <Pressable
              onPress={() => router.push('/historial')}
              hitSlop={12}
              accessibilityRole="link"
              accessibilityLabel="Ver todo el historial"
            >
              <Text style={styles.link}>Ver historial</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push(`/workout/${last.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Último entrenamiento: ${last.name}, ${formatRelativeDay(last.startedAt)}. ${formatDuration(duration(last))}, ${completedSets(last)} series, ${formatNumber(workoutVolume(last))} kilos. Abrir detalle`}
            style={({ pressed }) => pressed && { opacity: 0.8 }}
          >
            <Card style={styles.lastCard}>
              <View>
                <Text style={styles.lastWhen}>{formatRelativeDay(last.startedAt)}</Text>
                <Text style={styles.lastName}>{last.name}</Text>
              </View>

              <View style={styles.metrics}>
                <Metric icon="time-outline" value={formatDuration(duration(last))} label="Duración" />
                <Metric icon="layers-outline" value={String(completedSets(last))} label="Series" />
                <Metric icon="barbell-outline" value={`${formatNumber(workoutVolume(last))} kg`} label="Volumen" />
              </View>

              {volumeChange !== null && (
                <View style={[styles.trend, volumeChange < 0 && styles.trendDown]}>
                  <Ionicons
                    name={volumeChange >= 0 ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={volumeChange >= 0 ? colors.accent : colors.muted}
                  />
                  <Text style={[styles.trendText, volumeChange < 0 && { color: colors.muted }]}>
                    {volumeChange >= 0 ? `${volumeChange}% más` : `${Math.abs(volumeChange)}% menos`} volumen que la vez
                    anterior
                  </Text>
                </View>
              )}

              <View style={styles.bestList}>
                <Text style={styles.bestTitle}>Mejor serie por ejercicio</Text>
                {bestSets(last, 3).map((b) => (
                  <View key={b.exerciseId} style={styles.bestRow}>
                    <Text style={styles.bestName} numberOfLines={1}>
                      {getExercise(b.exerciseId)?.name ?? b.exerciseId}
                    </Text>
                    <Text style={styles.bestValue}>
                      {b.weight > 0 ? `${formatWeight(b.weight)} kg × ${b.reps}` : `${b.reps} reps`}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.link}>Ver detalle</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.accent} />
              </View>
            </Card>
          </Pressable>
        </>
      )}

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Esta semana
      </Text>
      <Card style={styles.weekCard}>
        <View style={styles.weekRow}>
          {DAYS.map((day, i) => {
            const done = trainedDays.has(i);
            const isToday = i === todayIndex;
            return (
              <View
                key={day.short}
                style={styles.dayCol}
                accessible
                accessibilityLabel={`${day.long}${isToday ? ', hoy' : ''}: ${done ? 'entrenado' : 'sin entrenar'}`}
              >
                <View style={[styles.dayDot, done && styles.dayDotDone, isToday && !done && styles.dayDotToday]}>
                  {done && <Ionicons name="checkmark" size={16} color={colors.primaryText} />}
                </View>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day.short}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.weekSummary}>
          <Text style={styles.weekStrong}>
            {thisWeek.length} {thisWeek.length === 1 ? 'entrenamiento' : 'entrenamientos'}
          </Text>{' '}
          · {formatNumber(weekVolume)} kg levantados
        </Text>
        {streak > 0 && (
          <View style={styles.streak}>
            <Ionicons name="flame" size={16} color={colors.accent} />
            <Text style={styles.streakText}>
              Racha de {streak} {streak === 1 ? 'semana' : 'semanas'} seguidas
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

function HeroCard({
  eyebrow,
  icon,
  title,
  meta,
  detail,
  action,
  actionLabel,
  onPress,
}: {
  eyebrow: string;
  icon: IconName;
  title: string;
  meta: string;
  detail?: string;
  action: string;
  actionLabel?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroEyebrowRow}>
        <Ionicons name={icon} size={16} color={colors.primaryText} />
        <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      </View>
      <Text style={styles.heroTitle} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.heroMeta}>{meta}</Text>
      {detail ? (
        <Text style={styles.heroDetail} numberOfLines={2}>
          {detail}
        </Text>
      ) : null}
      <Button
        title={action}
        icon="play"
        variant="secondary"
        size="lg"
        accessibilityLabel={actionLabel}
        onPress={onPress}
        style={styles.heroButton}
      />
    </View>
  );
}

function OptionRow({
  icon,
  title,
  subtitle,
  accessibilityLabel,
  onPress,
  tone = 'default',
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  accessibilityLabel?: string;
  onPress: () => void;
  tone?: 'default' | 'support';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
      style={({ pressed }) => [styles.option, tone === 'support' && styles.optionSupport, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.optionIcon, tone === 'support' && styles.optionIconSupport]}>
        <Ionicons name={icon} size={20} color={tone === 'support' ? colors.support : colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

function Metric({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.metric} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function routineMeta(r: Routine, history: Workout[]): string {
  const avg = averageDuration(history, r.id);
  const parts = [`${r.exerciseIds.length} ejercicios`];
  if (avg) parts.push(`unos ${formatDuration(avg)}`);
  return parts.join(' · ');
}

function lastDoneText(r: Routine, history: Workout[]): string {
  const last = history.find((w) => w.routineId === r.id);
  return last ? `Última vez: ${formatRelativeDay(last.startedAt).toLowerCase()}` : 'Aún no la has hecho';
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingBottom: 32, gap: spacing.md },
  greeting: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  date: { color: colors.muted, fontSize: 16, marginTop: 2 },

  hero: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrow: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: { color: colors.primaryText, fontSize: 28, fontWeight: '800', marginTop: spacing.xs, letterSpacing: -0.4 },
  heroMeta: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  heroDetail: { color: colors.primaryText, fontSize: 15, opacity: 0.75, marginTop: 2 },
  heroButton: { marginTop: spacing.lg },

  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: spacing.lg },
  link: { color: colors.accent, fontSize: 15, fontWeight: '700' },

  optionList: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSupport: { backgroundColor: colors.supportSoft, borderColor: colors.supportSoft },
  optionIconSupport: { backgroundColor: colors.card },
  optionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  optionSubtitle: { color: colors.muted, fontSize: 14, marginTop: 2 },

  lastCard: { gap: spacing.lg },
  lastWhen: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  lastName: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  metricValue: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
  metricLabel: { color: colors.muted, fontSize: 13 },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  trendDown: { backgroundColor: colors.bg },
  trendText: { color: colors.accent, fontSize: 14, fontWeight: '700', flex: 1 },
  bestList: { gap: spacing.sm },
  bestTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bestRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  bestName: { color: colors.text, fontSize: 15, flex: 1 },
  bestValue: { color: colors.text, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },

  weekCard: { gap: spacing.md },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotDone: { backgroundColor: colors.primary },
  dayDotToday: { borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.card },
  dayLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  dayLabelToday: { color: colors.text, fontWeight: '800' },
  weekSummary: { color: colors.muted, fontSize: 15 },
  weekStrong: { color: colors.text, fontWeight: '800' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
