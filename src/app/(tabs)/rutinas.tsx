import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DayPicker } from '../../components/DayPicker';
import { Button, Card, EmptyState } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';

export default function RoutinesScreen() {
  const { routines, createRoutine, updateRoutine } = useGym();
  const [name, setName] = useState('');

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createRoutine(trimmed);
    setName('');
    router.push(`/rutina/${id}`);
  };

  return (
    <FlatList
      data={routines}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.newRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre de la nueva rutina"
            placeholderTextColor={colors.muted}
            style={styles.input}
            onSubmitEditing={create}
            returnKeyType="done"
          />
          <Button title="Crear" icon="add" onPress={create} disabled={!name.trim()} />
        </View>
      }
      ListEmptyComponent={
        <EmptyState icon="barbell-outline" title="Sin rutinas" text="Crea tu primera rutina para empezar a entrenar." />
      }
      renderItem={({ item }) => {
        const names = item.exerciseIds.map((id) => getExercise(id)?.name).filter(Boolean);
        return (
          <Pressable onPress={() => router.push(`/rutina/${item.id}`)}>
            <Card style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.exercises} numberOfLines={2}>
                {names.length > 0 ? names.join(' · ') : 'Sin ejercicios todavía'}
              </Text>
              <Text style={styles.daysLabel}>Días que la entrenas</Text>
              <DayPicker value={item.days} onChange={(days) => updateRoutine(item.id, { days })} />
              <View style={styles.actions}>
                <Button
                  title="Editar"
                  icon="create-outline"
                  variant="secondary"
                  onPress={() => router.push(`/rutina/${item.id}`)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </Pressable>
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  card: { gap: spacing.sm },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  exercises: { color: colors.muted, fontSize: 14 },
  daysLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
