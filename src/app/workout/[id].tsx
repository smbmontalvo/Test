import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, Stat } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useGym } from '../../store/GymContext';
import { colors, spacing } from '../../theme';
import { completedSets, formatDate, formatDuration, formatNumber, workoutVolume } from '../../utils/stats';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history, deleteWorkout } = useGym();
  const workout = history.find((w) => w.id === id);

  if (!workout) {
    return <EmptyState icon="alert-circle-outline" title="Entrenamiento no encontrado" text="Puede que se haya eliminado." />;
  }

  const confirmDelete = () => {
    Alert.alert('Eliminar entrenamiento', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteWorkout(workout.id);
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{formatDate(workout.startedAt)}</Text>
      <Text style={styles.title}>{workout.name}</Text>

      <View style={styles.statsRow}>
        <Stat icon="time" label="Duración" value={formatDuration((workout.finishedAt ?? workout.startedAt) - workout.startedAt)} />
        <Stat icon="layers" label="Series" value={String(completedSets(workout))} />
        <Stat icon="barbell" label="Volumen (kg)" value={formatNumber(workoutVolume(workout))} />
      </View>

      <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
        {workout.exercises.length === 0 && (
          <Text style={styles.meta}>No se completó ninguna serie en este entrenamiento.</Text>
        )}
        {workout.exercises.map((e, i) => (
          <Card key={`${e.exerciseId}-${i}`}>
            <Text style={styles.exName}>{getExercise(e.exerciseId)?.name ?? e.exerciseId}</Text>
            {e.sets.map((s, j) => (
              <View key={j} style={styles.setRow}>
                <Text style={styles.setIndex}>{j + 1}</Text>
                <Text style={styles.setText}>
                  {s.weight || 0} kg × {s.reps || 0}
                </Text>
              </View>
            ))}
          </Card>
        ))}
      </View>

      <Button title="Eliminar entrenamiento" icon="trash" variant="danger" onPress={confirmDelete} style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  date: { color: colors.primary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  exName: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  setRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 4 },
  setIndex: { color: colors.muted, width: 20, fontWeight: '700' },
  setText: { color: colors.text, fontSize: 15 },
  meta: { color: colors.muted },
});
