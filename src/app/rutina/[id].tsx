import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { showAlert } from '../../components/Dialog';
import { DayPicker, formatDays } from '../../components/DayPicker';
import { Button, Card, EmptyState, IconButton, SectionTitle } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { smoothLayout } from '../../components/motion';

export default function RoutineEditScreen() {
  const inset = useScreenInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routines, updateRoutine, deleteRoutine } = useGym();
  const routine = routines.find((r) => r.id === id);

  if (!routine) {
    return <EmptyState icon="alert-circle-outline" title="Rutina no encontrada" text="Puede que se haya eliminado." />;
  }

  const setExercises = (exerciseIds: string[]) => updateRoutine(routine.id, { exerciseIds });

  const move = (index: number, delta: number) => {
    smoothLayout();
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
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: inset.top + spacing.lg, paddingBottom: inset.bottom + 40 }]}
      scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        value={routine.name}
        onChangeText={(name) => updateRoutine(routine.id, { name })}
        style={styles.input}
        placeholder="Nombre de la rutina"
        placeholderTextColor={colors.muted}
      />

      <SectionTitle>Días de entrenamiento</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        <DayPicker value={routine.days} onChange={(days) => updateRoutine(routine.id, { days })} />
        <Text style={styles.daysHint}>{formatDays(routine.days)}</Text>
      </Card>

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
                onPress={() => {
                  smoothLayout();
                  setExercises(routine.exerciseIds.filter((x) => x !== exerciseId));
                }}
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
        <Button title="Eliminar rutina" icon="trash" variant="danger" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  daysHint: { color: colors.muted, fontSize: 14 },
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
  index: { color: colors.accent, fontWeight: '800', width: 18 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
