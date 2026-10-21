import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { WEEK_DAYS } from '../../components/DayPicker';
import { ActivityRings, type Ring } from '../../components/home/ActivityRings';
import { WeekStrip } from '../../components/home/WeekStrip';
import { Burst, CountUp, FadeInUp, haptic, Pop, PressScale, smoothLayout } from '../../components/motion';
import { TodayChecklist } from '../../components/TodayChecklist';
import { Button } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { useToday } from '../../hooks/useToday';
import { useGym } from '../../store/GymContext';
import { colors, muscleColors, radius, spacing } from '../../theme';
import type { MuscleGroup, Routine, Workout } from '../../types';
import { cardioWeek } from '../../utils/cardio';
import { hasSchedule, nextPlanned, todayPlan } from '../../utils/schedule';
import {
  completedSets,
  formatDuration,
  formatNumber,
  formatRelativeDay,
  startOfWeek,
  trainedDaysThisWeek,
  workoutVolume,
} from '../../utils/stats';

type IconName = ComponentProps<typeof Ionicons>['name'];

const DAYS = WEEK_DAYS;
// Ring colors: validated categorical slots (green, blue, orange).
const RING_COLORS = { strength: '#008300', cardio: '#2a78d6', active: '#eb6834' };
const ACTIVE_DAYS_GOAL = 5;

const duration = (w: Workout) => (w.finishedAt ?? w.startedAt) - w.startedAt;

export default function HomeScreen() {
  const inset = useScreenInsets();
  const { history, routines, active, cardio, cardioGoal, startWorkout, setExerciseDone, closeStaleWorkout } =
    useGym();

  const now = useToday();
  // At midnight, close yesterday's unfinished workout so today's list shows.
  useEffect(() => closeStaleWorkout(now), [now, closeStaleWorkout]);

  // Weekly plan: which routine is scheduled for today, and is it done already?
  const { day: today, routine: todayRoutine, done: doneToday } = todayPlan(routines, history, now);
  const activeIsToday = !!active && active.routineId === todayRoutine?.id;
  const hasPlan = hasSchedule(routines);
  const upcoming = nextPlanned(routines, today);

  // Celebrate only the moment today's workout gets completed, not on every visit.
  const wasDone = useRef(!!doneToday);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (doneToday && !wasDone.current) {
      setCelebrate(true);
      haptic.success();
    }
    wasDone.current = !!doneToday;
  }, [doneToday]);

  // This week at a glance.
  const weekStart = startOfWeek(now);
  const lastWeekStart = startOfWeek(weekStart - 1);
  const thisWeek = history.filter((w) => w.startedAt >= weekStart);
  const weekVolume = thisWeek.reduce((acc, w) => acc + workoutVolume(w), 0);
  // Compare with last week up to the same point in time, so a Wednesday isn't
  // measured against a whole finished week.
  const lastWeekSamePoint = lastWeekStart + (now - weekStart);
  const lastWeekVolume = history
    .filter((w) => w.startedAt >= lastWeekStart && w.startedAt < lastWeekSamePoint)
    .reduce((acc, w) => acc + workoutVolume(w), 0);
  const volumeTrend = lastWeekVolume > 0 ? Math.round(((weekVolume - lastWeekVolume) / lastWeekVolume) * 100) : null;
  const cardioThisWeek = cardioWeek(cardio, now);
  const plannedDays = new Set(routines.flatMap((r) => r.days ?? []));
  const activeDays = new Set(trainedDaysThisWeek(history, now));
  cardioThisWeek.perDay.forEach((m, i) => m > 0 && activeDays.add(i));

  const rings: Ring[] = [
    {
      key: 'strength',
      label: 'Fuerza',
      icon: 'barbell',
      color: RING_COLORS.strength,
      value: thisWeek.length,
      goal: plannedDays.size || 3,
      unit: 'entrenos',
    },
    { key: 'cardio', label: 'Cardio', icon: 'pulse', color: RING_COLORS.cardio, value: cardioThisWeek.minutes, goal: cardioGoal, unit: 'min' },
    { key: 'active', label: 'Días activos', icon: 'flame', color: RING_COLORS.active, value: activeDays.size, goal: ACTIVE_DAYS_GOAL, unit: 'días' },
  ];
  const ringsDone = rings.filter((r) => r.value >= r.goal).length;

  const last = history[0];

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: inset.top + spacing.lg, paddingBottom: inset.bottom + 32 }]}
      scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }}
    >
      <FadeInUp delay={60}>
        <WeekStrip weekStart={weekStart} today={today} active={activeDays} planned={plannedDays} />
      </FadeInUp>

      {/* Today's plan: the hero of the screen. */}
      <FadeInUp delay={120}>
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
          <View style={styles.hero} accessible accessibilityRole="header">
            <View style={styles.doneIconWrap}>
              {celebrate && <Burst size={160} />}
              <Pop visible style={styles.doneIcon}>
                <Ionicons name="checkmark" size={26} color={colors.primaryText} />
              </Pop>
            </View>
            <Text style={styles.heroTitle}>¡Entrenamiento completado!</Text>
            <Text style={styles.heroMeta}>
              {todayRoutine.name} · {completedSets(doneToday)} series · {formatNumber(workoutVolume(doneToday))} kg
            </Text>
            {upcoming && (
              <Text style={styles.heroNote}>
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
            onToggle={(exerciseId, done) => {
              smoothLayout(360);
              setExerciseDone(todayRoutine.id, exerciseId, done);
            }}
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
            muscles={routineMuscles(todayRoutine)}
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
      </FadeInUp>

      {/* Weekly goals as activity rings. */}
      <FadeInUp delay={180}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle} accessibilityRole="header">
              Tu semana
            </Text>
            <Text style={styles.panelBadge}>
              {ringsDone === rings.length ? '¡Semana completa!' : `${ringsDone} de ${rings.length} metas`}
            </Text>
          </View>
          <ActivityRings rings={rings} />
        </View>
      </FadeInUp>

      {/* Bento: two read-only tiles side by side. */}
      <FadeInUp delay={240} style={styles.bentoRow}>
        <View style={[styles.tile, { flex: 1 }]} accessible accessibilityLabel={`Cardio esta semana: ${cardioThisWeek.minutes} de ${cardioGoal} minutos`}>
          <View style={styles.tileHeader}>
            <View style={[styles.tileIcon, { backgroundColor: RING_COLORS.cardio }]}>
              <Ionicons name="pulse" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.tileLabel}>Cardio</Text>
          </View>
          <Text style={styles.tileValue}>
            <CountUp value={cardioThisWeek.minutes} delay={300} />
            <Text style={styles.tileUnit}> min</Text>
          </Text>
          <MiniBars values={cardioThisWeek.perDay} today={today} color={RING_COLORS.cardio} />
        </View>

        <View style={[styles.tile, { flex: 1 }]} accessible accessibilityLabel={`Levantado esta semana: ${formatNumber(weekVolume)} kilos`}>
          <View style={styles.tileHeader}>
            <View style={[styles.tileIcon, { backgroundColor: RING_COLORS.strength }]}>
              <Ionicons name="barbell" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.tileLabel}>Levantado</Text>
          </View>
          <Text style={styles.tileValue}>
            <CountUp value={weekVolume} format={(n) => formatNumber(Math.round(n))} delay={340} />
            <Text style={styles.tileUnit}> kg</Text>
          </Text>
          {volumeTrend !== null ? (
            <View style={styles.trendRow}>
              <View style={[styles.trendPill, volumeTrend < 0 && styles.trendPillDown]}>
                <Ionicons
                  name={volumeTrend >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={volumeTrend >= 0 ? colors.accent : colors.muted}
                />
                <Text style={[styles.trendText, volumeTrend < 0 && { color: colors.muted }]}>{Math.abs(volumeTrend)}%</Text>
              </View>
              <Text style={styles.tileNote}>vs semana pasada</Text>
            </View>
          ) : (
            <Text style={styles.tileNote}>esta semana</Text>
          )}
        </View>
      </FadeInUp>

      {last && (
        <FadeInUp delay={300}>
          <PressScale
            pressedScale={0.98}
            onPress={() => router.push(`/workout/${last.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Último entrenamiento: ${last.name}, ${formatRelativeDay(last.startedAt, now)}. ${formatDuration(duration(last))}, ${completedSets(last)} series, ${formatNumber(workoutVolume(last))} kilos. Abrir detalle`}
            style={styles.lastTile}
          >
            <View style={styles.lastDate}>
              <Text style={styles.lastDateDay}>{DAYS[(new Date(last.startedAt).getDay() + 6) % 7].short}</Text>
              <Text style={styles.lastDateNum}>{new Date(last.startedAt).getDate()}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.lastEyebrow}>Último entrenamiento · {formatRelativeDay(last.startedAt, now).toLowerCase()}</Text>
              <Text style={styles.lastName} numberOfLines={1}>
                {last.name}
              </Text>
              <Text style={styles.lastMeta}>
                {formatDuration(duration(last))} · {completedSets(last)} series · {formatNumber(workoutVolume(last))} kg
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </PressScale>
        </FadeInUp>
      )}

      <FadeInUp delay={360}>
        <PressScale
          pressedScale={0.97}
          onPress={() => router.push('/animo')}
          accessibilityRole="button"
          accessibilityLabel="Me estoy desanimando. Ver un resumen de cómo has mejorado"
          style={styles.support}
        >
          <View style={styles.supportIcon}>
            <Ionicons name="heart" size={20} color={colors.support} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Me estoy desanimando</Text>
            <Text style={styles.supportText}>Mira todo lo que has mejorado</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.support} />
        </PressScale>
      </FadeInUp>
    </ScrollView>
  );
}

function HeroCard({
  eyebrow,
  icon,
  title,
  meta,
  muscles,
  action,
  actionLabel,
  onPress,
}: {
  eyebrow: string;
  icon: IconName;
  title: string;
  meta: string;
  muscles?: MuscleGroup[];
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
      {muscles && muscles.length > 0 && (
        <View style={styles.muscles}>
          {muscles.map((m) => (
            <View key={m} style={styles.muscleChip}>
              <View style={[styles.muscleDot, { backgroundColor: muscleColors[m] }]} />
              <Text style={styles.muscleText}>{m}</Text>
            </View>
          ))}
        </View>
      )}
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

// Seven tiny bars for a tile; a sparkline, so no axis or labels.
function MiniBars({ values, today, color }: { values: number[]; today: number; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <View style={styles.miniBars}>
      {values.map((v, i) => (
        <View key={i} style={styles.miniSlot}>
          <Pop visible delay={400 + i * 50} style={{ width: '100%', alignItems: 'center' }}>
            <View
              style={[
                styles.miniBar,
                {
                  height: v > 0 ? Math.max(4, (v / max) * 28) : 3,
                  backgroundColor: v > 0 ? color : colors.cardAlt,
                  opacity: i > today ? 0.5 : 1,
                },
              ]}
            />
          </Pop>
        </View>
      ))}
    </View>
  );
}

function routineMuscles(r: Routine): MuscleGroup[] {
  const seen: MuscleGroup[] = [];
  for (const id of r.exerciseIds) {
    const m = getExercise(id)?.muscle;
    if (m && !seen.includes(m)) seen.push(m);
  }
  return seen.slice(0, 4);
}

function plannedMeta(exerciseCount: number, history: Workout[], routineId: string): string {
  const past = history.filter((w) => w.routineId === routineId && w.finishedAt);
  const parts = [`${exerciseCount} ejercicios`];
  if (past.length > 0) parts.push(`unos ${formatDuration(past.reduce((acc, w) => acc + duration(w), 0) / past.length)}`);
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, gap: spacing.lg },


  hero: { backgroundColor: colors.primary, borderRadius: 28, padding: spacing.xl, gap: spacing.xs },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrow: { color: colors.primaryText, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { color: colors.primaryText, fontSize: 34, fontWeight: '800', marginTop: spacing.xs, letterSpacing: -0.8, lineHeight: 38 },
  heroMeta: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  heroNote: { color: colors.primaryText, fontSize: 15, opacity: 0.75, marginTop: spacing.xs },
  heroButton: { marginTop: spacing.lg },
  muscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  muscleDot: { width: 8, height: 8, borderRadius: 4 },
  muscleText: { color: colors.primaryText, fontSize: 13, fontWeight: '700' },
  doneIconWrap: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  doneIcon: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },

  restCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  restHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  restEyebrow: { color: colors.accent, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  restTitle: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  restText: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  restStrong: { color: colors.text, fontWeight: '700' },

  panel: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  panelBadge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },

  bentoRow: { flexDirection: 'row', gap: spacing.md },
  tile: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tileHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  tileValue: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  tileUnit: { color: colors.muted, fontSize: 14, fontWeight: '700', letterSpacing: 0 },
  tileNote: { color: colors.muted, fontSize: 13 },
  trendRow: { gap: 4 },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendPillDown: { backgroundColor: colors.cardAlt },
  trendText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  miniBars: { flexDirection: 'row', alignItems: 'flex-end', height: 30, gap: 4 },
  miniSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 30 },
  miniBar: { width: '100%', maxWidth: 10, borderTopLeftRadius: 3, borderTopRightRadius: 3 },

  lastTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  lastDate: {
    width: 52,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastDateDay: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  lastDateNum: { color: colors.text, fontSize: 20, fontWeight: '800' },
  lastEyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800' },
  lastName: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 2 },
  lastMeta: { color: colors.muted, fontSize: 13, marginTop: 2, fontVariant: ['tabular-nums'] },

  support: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.supportSoft,
    borderRadius: 24,
    padding: spacing.lg,
  },
  supportIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  supportTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  supportText: { color: colors.muted, fontSize: 14, marginTop: 2 },
});
