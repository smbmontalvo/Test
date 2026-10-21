import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WEEK_DAYS } from '../../components/DayPicker';
import { TodayChecklist } from '../../components/TodayChecklist';
import { Button, Card } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';
import type { Workout } from '../../types';
import { useToday } from '../../hooks/useToday';
import { hasSchedule, nextPlanned, todayPlan } from '../../utils/schedule';
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

const DAYS = WEEK_DAYS;

const duration = (w: Workout) => (w.finishedAt ?? w.startedAt) - w.startedAt;

function bestSets(w: Workout, limit: number) {
  return w.exercises.slice(0, limit).map((e) => {
    const best = e.sets.reduce((a, b) => (toNumber(b.weight) > toNumber(a.weight) ? b : a), e.sets[0]);
    return { exerciseId: e.exerciseId, weight: toNumber(best.weight), reps: toNumber(best.reps) };
  });
}

export default function HomeScreen() {
  const { profile, history, routines, active, startWorkout, setExerciseDone, closeStaleWorkout } = useGym();

  const now = useToday();
  // At midnight, close yesterday's unfinished workout so today's list shows.
  useEffect(() => closeStaleWorkout(now), [now, closeStaleWorkout]);
  const firstName = (profile.alias || profile.name).trim().split(/\s+/)[0];

  // Weekly plan: which routine is scheduled for today, and is it done already?
  const { day: today, routine: todayRoutine, done: doneToday } = todayPlan(routines, history, now);
  const activeIsToday = !!active && active.routineId === todayRoutine?.id;
  const hasPlan = hasSchedule(routines);
  const upcoming = nextPlanned(routines, today);

  const last = history[0];
  const previousSame = last?.routineId ? history.slice(1).find((w) => w.routineId === last.routineId) : undefined;
  const volumeChange =
    last && previousSame && workoutVolume(previousSame) > 0
      ? Math.round(((workoutVolume(last) - workoutVolume(previousSame)) / workoutVolume(previousSame)) * 100)
      : null;

  const weekStart = startOfWeek(now);
  const thisWeek = history.filter((w) => w.startedAt >= weekStart);
  const weekVolume = thisWeek.reduce((acc, w) => acc + workoutVolume(w), 0);
  const trainedDays = trainedDaysThisWeek(history, now);
  const streak = weekStreak(history, now);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View accessible accessibilityRole="header">
        <Text style={styles.greeting}>
          {greeting(now)}
          {firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={styles.date}>{capitalize(formatLongDate(now))}</Text>
      </View>

      {active && !activeIsToday ? (
        <HeroCard
          eyebrow="Entrenamiento en curso"
          icon="flash"
          title={active.name}
          meta={`Empezaste hace ${formatDuration(now - active.startedAt)} · ${completedSets(active)} de ${active.exercises.reduce((n, e) => n + e.sets.length, 0)} series hechas`}
          action="Continuar entrenamiento"
          onPress={() => router.push('/entrenamiento')}
        />
      ) : todayRoutine && doneToday && !active ? (
        <View style={styles.doneCard} accessible accessibilityRole="header">
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={26} color={colors.primaryText} />
          </View>
          <Text style={styles.doneTitle}>¡Entrenamiento completado!</Text>
          <Text style={styles.doneMeta}>
            {todayRoutine.name} · {completedSets(doneToday)} series · {formatNumber(workoutVolume(doneToday))} kg
          </Text>
          {upcoming && (
            <Text style={styles.doneNext}>
              Próximo: {upcoming.routine.name}, {upcoming.when}
            </Text>
          )}
        </View>
      ) : todayRoutine && activeIsToday ? (
        <TodayChecklist
          routine={todayRoutine}
          dayName={DAYS[today].long}
          workout={active}
          history={history}
          onToggle={(exerciseId, done) => setExerciseDone(todayRoutine.id, exerciseId, done)}
          onOpenExercise={() => router.push('/entrenamiento')}
        />
      ) : todayRoutine ? (
        // Before starting, today's plan is a single call to action; the
        // exercise list appears once the workout has begun.
        <HeroCard
          eyebrow={`Hoy toca · ${DAYS[today].long}`}
          icon="calendar"
          title={todayRoutine.name}
          meta={plannedMeta(todayRoutine.exerciseIds.length, history, todayRoutine.id)}
          action="Iniciar entrenamiento"
          actionLabel={`Iniciar entrenamiento de ${todayRoutine.name}`}
          onPress={() => startWorkout(todayRoutine.id)}
        />
      ) : hasPlan ? (
        <View style={styles.restCard}>
          <View style={styles.restHeader}>
            <Ionicons name="moon" size={18} color={colors.accent} />
            <Text style={styles.restEyebrow}>Hoy toca descansar</Text>
          </View>
          <Text style={styles.restTitle}>Recupera energía</Text>
          {upcoming && (
            <Text style={styles.restText}>
              Próximo entrenamiento: <Text style={styles.restStrong}>{upcoming.routine.name}</Text>, {upcoming.when}.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.restCard}>
          <View style={styles.restHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent} />
            <Text style={styles.restEyebrow}>Sin plan todavía</Text>
          </View>
          <Text style={styles.restTitle}>Programa tu semana</Text>
          <Text style={styles.restText}>
            Elige qué días entrenas cada rutina y aquí aparecerá la lista del día, lista para marcar.
          </Text>
          <Button
            title="Elegir días"
            icon="calendar"
            variant="secondary"
            onPress={() => router.push('/rutinas')}
            style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}
          />
        </View>
      )}

      <OptionRow
        icon="heart"
        title="Me estoy desanimando"
        subtitle="Mira todo lo que has mejorado"
        accessibilityLabel="Me estoy desanimando. Ver un resumen de cómo has mejorado"
        onPress={() => router.push('/animo')}
        tone="support"
      />

      {last && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Último entrenamiento
          </Text>
          <Pressable
            onPress={() => router.push(`/workout/${last.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Último entrenamiento: ${last.name}, ${formatRelativeDay(last.startedAt, now)}. ${formatDuration(duration(last))}, ${completedSets(last)} series, ${formatNumber(workoutVolume(last))} kilos. Abrir detalle`}
            style={({ pressed }) => pressed && { opacity: 0.8 }}
          >
            <Card style={styles.lastCard}>
              <View>
                <Text style={styles.lastWhen}>{formatRelativeDay(last.startedAt, now)}</Text>
                <Text style={styles.lastName}>{last.name}</Text>
              </View>

              <View style={styles.metrics}>
                <Metric icon="time-outline" value={formatDuration(duration(last))} label="Duración" />
                <Metric icon="layers-outline" value={String(completedSets(last))} label="Series" />
                <Metric icon="barbell-outline" value={`${formatNumber(workoutVolume(last))} kg`} label="Volumen" />
              </View>

              {volumeChange !== null && volumeChange !== 0 && (
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
            const isToday = i === today;
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

function plannedMeta(exerciseCount: number, history: Workout[], routineId: string): string {
  const past = history.filter((w) => w.routineId === routineId && w.finishedAt);
  const parts = [`${exerciseCount} ejercicios`];
  if (past.length > 0) parts.push(`unos ${formatDuration(past.reduce((acc, w) => acc + duration(w), 0) / past.length)}`);
  return parts.join(' · ');
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 32, gap: spacing.md },
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

  doneCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  doneIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  doneTitle: { color: colors.primaryText, fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  doneMeta: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  doneNext: { color: colors.primaryText, fontSize: 15, opacity: 0.75, marginTop: spacing.xs },

  restCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  restHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  restEyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  restTitle: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  restText: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  restStrong: { color: colors.text, fontWeight: '700' },

  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: spacing.lg },

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
