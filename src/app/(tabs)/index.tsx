import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, SectionTitle, Stat } from '../../components/ui';
import { useStartWorkout } from '../../hooks/useStartWorkout';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';
import {
  completedSets,
  formatDate,
  formatDuration,
  formatNumber,
  startOfWeek,
  trainedDaysThisWeek,
  weekStreak,
  workoutVolume,
} from '../../utils/stats';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function HomeScreen() {
  const { history, routines, active } = useGym();
  const startWorkout = useStartWorkout();

  const weekStart = startOfWeek(Date.now());
  const thisWeek = history.filter((w) => w.startedAt >= weekStart);
  const weekVolume = thisWeek.reduce((acc, w) => acc + workoutVolume(w), 0);
  const trainedDays = trainedDaysThisWeek(history);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const last = history[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hello}>¡A darle duro! 💪</Text>
      <Text style={styles.subtitle}>{capitalize(formatDate(Date.now()))}</Text>

      {active && (
        <Pressable onPress={() => router.push('/entrenamiento')}>
          <Card style={styles.activeCard}>
            <Ionicons name="flash" size={22} color={colors.primaryText} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTitle}>Entrenamiento en curso</Text>
              <Text style={styles.activeText}>{active.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.primaryText} />
          </Card>
        </Pressable>
      )}

      <View style={styles.statsRow}>
        <Stat icon="calendar" label="Esta semana" value={String(thisWeek.length)} />
        <Stat icon="flame" label="Racha (semanas)" value={String(weekStreak(history))} />
        <Stat icon="barbell" label="Kg esta semana" value={formatNumber(weekVolume)} />
      </View>

      <Card style={styles.weekCard}>
        {DAY_LABELS.map((label, i) => {
          const done = trainedDays.has(i);
          return (
            <View key={label} style={styles.dayCol}>
              <View style={[styles.dayDot, done && styles.dayDotDone, i === todayIndex && styles.dayDotToday]}>
                {done && <Ionicons name="checkmark" size={14} color={colors.primaryText} />}
              </View>
              <Text style={[styles.dayLabel, i === todayIndex && { color: colors.text }]}>{label}</Text>
            </View>
          );
        })}
      </Card>

      <SectionTitle>Empezar entrenamiento</SectionTitle>
      <Button title="Entrenamiento libre" icon="add-circle" onPress={() => startWorkout()} />
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {routines.map((r) => (
          <Pressable key={r.id} onPress={() => startWorkout(r.id)}>
            <Card style={styles.routineRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName}>{r.name}</Text>
                <Text style={styles.routineMeta}>{r.exerciseIds.length} ejercicios</Text>
              </View>
              <Ionicons name="play-circle" size={30} color={colors.accent} />
            </Card>
          </Pressable>
        ))}
      </View>

      {last && (
        <>
          <SectionTitle>Último entrenamiento</SectionTitle>
          <Pressable onPress={() => router.push(`/workout/${last.id}`)}>
            <Card>
              <Text style={styles.routineName}>{last.name}</Text>
              <Text style={styles.routineMeta}>
                {capitalize(formatDate(last.startedAt))} ·{' '}
                {formatDuration((last.finishedAt ?? last.startedAt) - last.startedAt)} · {completedSets(last)} series ·{' '}
                {formatNumber(workoutVolume(last))} kg
              </Text>
            </Card>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  hello: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 2, marginBottom: spacing.lg },
  activeCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  activeTitle: { color: colors.primaryText, fontWeight: '800', fontSize: 16 },
  activeText: { color: colors.primaryText, opacity: 0.8 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  weekCard: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 30,
    height: 30,
    borderRadius: radius.lg,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotDone: { backgroundColor: colors.primary },
  dayDotToday: { borderWidth: 2, borderColor: colors.accent },
  dayLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  routineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  routineName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  routineMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
