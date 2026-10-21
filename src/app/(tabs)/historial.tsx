import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, Stat } from '../../components/ui';
import { useGym } from '../../store/GymContext';
import { colors, spacing } from '../../theme';
import { completedSets, formatDate, formatDuration, formatNumber, workoutVolume } from '../../utils/stats';

export default function HistoryScreen() {
  const { history } = useGym();
  const totalVolume = history.reduce((acc, w) => acc + workoutVolume(w), 0);
  const totalTime = history.reduce((acc, w) => acc + ((w.finishedAt ?? w.startedAt) - w.startedAt), 0);

  return (
    <FlatList
      data={history}
      keyExtractor={(w) => w.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        history.length > 0 ? (
          <View style={styles.statsRow}>
            <Stat icon="trophy" label="Entrenos" value={String(history.length)} />
            <Stat icon="barbell" label="Kg totales" value={formatNumber(totalVolume)} />
            <Stat icon="time" label="Horas" value={(totalTime / 3600000).toFixed(1)} />
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState
          icon="stats-chart-outline"
          title="Aún no hay entrenamientos"
          text="Cuando termines tu primer entrenamiento aparecerá aquí."
        />
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/workout/${item.id}`)}>
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{formatDate(item.startedAt)}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {formatDuration((item.finishedAt ?? item.startedAt) - item.startedAt)} · {completedSets(item)} series ·{' '}
                {formatNumber(workoutVolume(item))} kg
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  date: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
