import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import {
  MONTHS_LONG,
  plural,
  recordsByWorkout,
  relativeAgo,
  shortWorkoutName,
  totalReps,
  weekLabel,
  weekStart,
  WEEKDAYS_SHORT,
  workoutDuration,
  workoutMuscles,
} from '../../components/history/historyUtils';
import { MuscleTags, PrPill } from '../../components/history/parts';
import { Button } from '../../components/ui';
import { useToday } from '../../hooks/useToday';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';
import type { Workout } from '../../types';
import {
  completedSets,
  formatDuration,
  formatLongDate,
  formatNumber,
  isSameDay,
  workoutVolume,
} from '../../utils/stats';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { CountUp, FadeInUp, PressScale } from '../../components/motion';

type WeekSection = {
  key: string;
  title: string;
  spoken: string;
  volume: number;
  data: Workout[];
};

function groupByWeek(history: Workout[], now: number): WeekSection[] {
  const sections: WeekSection[] = [];
  for (const w of history) {
    const start = weekStart(w.startedAt);
    let section = sections[sections.length - 1];
    if (!section || section.key !== String(start)) {
      section = { key: String(start), ...weekLabel(start, now), volume: 0, data: [] };
      sections.push(section);
    }
    section.data.push(w);
    section.volume += workoutVolume(w);
  }
  return sections;
}

export default function HistoryScreen() {
  const inset = useScreenInsets();
  const { history } = useGym();
  const now = useToday();
  const sorted = useMemo(() => [...history].sort((a, b) => b.startedAt - a.startedAt), [history]);
  const records = useMemo(() => recordsByWorkout(history), [history]);
  const sections = useMemo(() => groupByWeek(sorted, now), [sorted, now]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(w) => w.id}
      contentContainerStyle={[styles.container, history.length === 0 && styles.containerEmpty, { paddingTop: inset.top + spacing.lg, paddingBottom: inset.bottom + 40 }]}
      scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={history.length > 0 ? <MonthSummary history={sorted} records={records} now={now} /> : undefined}
      ListEmptyComponent={<HistoryEmpty />}
      renderSectionHeader={({ section }) => (
        <View
          style={styles.sectionHeader}
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${section.spoken}: ${plural(section.data.length, 'entrenamiento', 'entrenamientos')}${
            section.volume > 0 ? `, ${formatNumber(section.volume)} kilos` : ''
          }`}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionMeta}>
            {plural(section.data.length, 'entreno', 'entrenos')}
            {section.volume > 0 ? ` · ${formatNumber(section.volume)} kg` : ''}
          </Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item, index }) => (
        <FadeInUp delay={Math.min(index, 6) * 50}>
          <WorkoutRow workout={item} prCount={records.get(item.id)?.size ?? 0} now={now} />
        </FadeInUp>
      )}
    />
  );
}

function MonthSummary({ history, records, now }: { history: Workout[]; records: Map<string, Set<string>>; now: number }) {
  const today = new Date(now);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const month = history.filter((w) => w.startedAt >= monthStart);
  const volume = month.reduce((acc, w) => acc + workoutVolume(w), 0);
  const time = month.reduce((acc, w) => acc + workoutDuration(w), 0);
  const prs = month.reduce((acc, w) => acc + (records.get(w.id)?.size ?? 0), 0);
  const allTime = history.reduce((acc, w) => acc + workoutDuration(w), 0);
  const last = history[0];

  return (
    <View style={styles.summary}>
      <View style={styles.summaryEyebrowRow}>
        <Ionicons name="calendar" size={16} color={colors.primaryText} />
        <Text style={styles.summaryEyebrow}>{MONTHS_LONG[today.getMonth()]}</Text>
      </View>

      {month.length > 0 ? (
        <>
          <Text style={styles.summaryTitle} accessibilityRole="header">
            {plural(month.length, 'entrenamiento', 'entrenamientos')} este mes
          </Text>
          <View style={styles.figures}>
            {volume > 0 ? (
              <Figure amount={volume} format={(n) => formatNumber(Math.round(n))} label="kg levantados" spoken={`${formatNumber(volume)} kilos levantados`} />
            ) : (
              <Figure amount={month.reduce((acc, w) => acc + totalReps(w), 0)} format={(n) => formatNumber(Math.round(n))} label="repeticiones" />
            )}
            <View style={styles.figureDivider} />
            <Figure
              amount={time / 3600000}
              format={(n) => n.toFixed(1).replace('.', ',')}
              label="horas entrenando"
              spoken={`${formatDuration(time)} entrenando`}
            />
            <View style={styles.figureDivider} />
            <Figure amount={prs} label={prs === 1 ? 'récord' : 'récords'} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.summaryTitle} accessibilityRole="header">
            Aún no has entrenado este mes
          </Text>
          <Text style={styles.summaryText}>
            Tu último entrenamiento fue {relativeAgo(last.startedAt, now).toLowerCase()}. ¿Vamos a por el primero?
          </Text>
        </>
      )}

      <Text style={styles.summaryFooter}>
        Desde que empezaste: {plural(history.length, 'entrenamiento', 'entrenamientos')} · {formatDuration(allTime)}
      </Text>
    </View>
  );
}

function Figure({
  amount,
  format = (n) => String(Math.round(n)),
  label,
  spoken,
}: {
  amount: number;
  format?: (n: number) => string;
  label: string;
  spoken?: string;
}) {
  const value = format(amount);
  return (
    <View style={styles.figure} accessible accessibilityLabel={spoken ?? `${value} ${label}`}>
      <CountUp value={amount} format={format} style={styles.figureValue} />
      <Text style={styles.figureLabel}>{label}</Text>
    </View>
  );
}

function WorkoutRow({ workout, prCount, now }: { workout: Workout; prCount: number; now: number }) {
  const date = new Date(workout.startedAt);
  const isToday = isSameDay(workout.startedAt, now);
  const muscles = workoutMuscles(workout);
  const sets = completedSets(workout);
  const volume = workoutVolume(workout);
  const reps = totalReps(workout);
  const duration = formatDuration(workoutDuration(workout));
  const load = volume > 0 ? `${formatNumber(volume)} kg` : `${formatNumber(reps)} reps`;

  const label = [
    `${isToday ? 'Hoy, ' : ''}${formatLongDate(workout.startedAt)}`,
    workout.name,
    `${duration}, ${plural(sets, 'serie', 'series')}, ${volume > 0 ? `${formatNumber(volume)} kilos` : `${reps} repeticiones`}`,
    muscles.length > 0 ? `Músculos: ${muscles.join(', ')}` : '',
    prCount > 0 ? plural(prCount, 'récord personal', 'récords personales') : '',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <PressScale
      pressedScale={0.98}
      onPress={() => router.push(`/workout/${workout.id}`)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Abre el detalle del entrenamiento"
      style={styles.row}
    >
      <View style={[styles.dateChip, isToday && styles.dateChipToday]}>
        <Text style={[styles.dateWeekday, isToday && styles.dateTextToday]}>{WEEKDAYS_SHORT[date.getDay()]}</Text>
        <Text style={[styles.dateDay, isToday && styles.dateTextToday]}>{date.getDate()}</Text>
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowName} numberOfLines={1}>
            {shortWorkoutName(workout.name)}
          </Text>
          {prCount > 0 && <PrPill label={prCount > 1 ? `${prCount} PR` : 'PR'} />}
        </View>
        <Text style={styles.rowMeta}>
          {duration} · {plural(sets, 'serie', 'series')} · {load}
        </Text>
        <MuscleTags muscles={muscles} max={3} />
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </PressScale>
  );
}

function HistoryEmpty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-clear" size={34} color={colors.primaryText} />
      </View>
      <Text style={styles.emptyTitle} accessibilityRole="header">
        Tu historial empieza hoy
      </Text>
      <Text style={styles.emptyText}>
        Cada entrenamiento que termines quedará guardado aquí, agrupado por semanas y con tus récords marcados.
      </Text>
      <Button
        title="Ir a Inicio"
        icon="home"
        size="lg"
        onPress={() => router.navigate('/')}
        style={styles.emptyButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  containerEmpty: { flexGrow: 1, justifyContent: 'center' },

  summary: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  summaryEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryEyebrow: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryTitle: { color: colors.primaryText, fontSize: 26, fontWeight: '800', letterSpacing: -0.4, marginTop: spacing.xs },
  summaryText: { color: colors.primaryText, fontSize: 16, lineHeight: 22, marginTop: 2 },
  figures: { flexDirection: 'row', alignItems: 'stretch', marginTop: spacing.lg },
  figure: { flex: 1, gap: 2 },
  figureDivider: { width: 1, backgroundColor: 'rgba(20,22,27,0.15)', marginHorizontal: spacing.md },
  figureValue: { color: colors.primaryText, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  figureLabel: { color: colors.primaryText, fontSize: 13, opacity: 0.75 },
  summaryFooter: {
    color: colors.primaryText,
    fontSize: 13,
    opacity: 0.75,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20,22,27,0.12)',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  sectionMeta: { color: colors.muted, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    paddingRight: spacing.sm,
  },
  dateChip: {
    width: 54,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dateChipToday: { backgroundColor: colors.primary },
  dateWeekday: { color: colors.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  dateDay: { color: colors.text, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: -1 },
  dateTextToday: { color: colors.primaryText },
  rowBody: { flex: 1, gap: 4 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowName: { color: colors.text, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  rowMeta: { color: colors.muted, fontSize: 14, fontVariant: ['tabular-nums'] },

  empty: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.sm },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 21, textAlign: 'center', maxWidth: 320 },
  emptyButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
