import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { showAlert } from '../../components/Dialog';
import { Button, Card, EmptyState, IconButton, SectionTitle } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useStartWorkout } from '../../hooks/useStartWorkout';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';

export default function RoutineEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routines, updateRoutine, deleteRoutine } = useGym();
  const startWorkout = useStartWorkout();
  const routine = routines.find((r) => r.id === id);

  if (!routine) {
    return <EmptyState icon="alert-circle-outline" title="Rutina no encontrada" text="Puede que se haya eliminado." />;
  }

  const setExercises = (exerciseIds: string[]) => updateRoutine(routine.id, { exerciseIds });

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= routine.exerciseIds.length) return;
    const next = [...routine.exerciseIds];
    [next[index], next[target]] = [next[target], next[index]];
    setExercises(next);
  };

  const confirmDelete = () => {
    showAlert('Eliminar rutina', `¿Seguro que quieres eliminar "${routine.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteRoutine(routine.id);
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        value={routine.name}
        onChangeText={(name) => updateRoutine(routine.id, { name })}
        style={styles.input}
        placeholder="Nombre de la rutina"
        placeholderTextColor={colors.muted}
      />

      <SectionTitle>Ejercicios ({routine.exerciseIds.length})</SectionTitle>
      <View style={{ gap: spacing.sm }}>
        {routine.exerciseIds.map((exerciseId, i) => {
          const ex = getExercise(exerciseId);
          return (
            <Card key={exerciseId} style={styles.row}>
              <Text style={styles.index}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{ex?.name ?? exerciseId}</Text>
                {ex && <Text style={styles.meta}>{ex.muscle}</Text>}
              </View>
              <IconButton icon="chevron-up" onPress={() => move(i, -1)} />
              <IconButton icon="chevron-down" onPress={() => move(i, 1)} />
              <IconButton
                icon="trash-outline"
                color={colors.danger}
                onPress={() => setExercises(routine.exerciseIds.filter((x) => x !== exerciseId))}
              />
            </Card>
          );
        })}
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Button
          title="Añadir ejercicio"
          icon="add"
          variant="secondary"
          onPress={() => router.push({ pathname: '/elegir-ejercicio', params: { rutina: routine.id } })}
        />
        <Button
          title="Empezar esta rutina"
          icon="play"
          onPress={() => startWorkout(routine.id)}
          disabled={routine.exerciseIds.length === 0}
        />
        <Button title="Eliminar rutina" icon="trash" variant="danger" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  label: { color: colors.muted, fontSize: 13, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  index: { color: colors.primary, fontWeight: '800', width: 18 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
