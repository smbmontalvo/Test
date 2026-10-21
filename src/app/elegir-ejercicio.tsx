import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState } from '../components/ui';
import { EXERCISES } from '../data/exercises';
import { useGym } from '../store/GymContext';
import { colors, radius, spacing } from '../theme';

// Modal exercise picker. With ?rutina=<id> it adds to that routine,
// otherwise it adds to the workout in progress.
export default function ExercisePickerScreen() {
  const { rutina } = useLocalSearchParams<{ rutina?: string }>();
  const { routines, updateRoutine, addExerciseToActive } = useGym();
  const [query, setQuery] = useState('');

  const routine = routines.find((r) => r.id === rutina);
  const q = query.trim().toLowerCase();
  const filtered = EXERCISES.filter(
    (e) => e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q),
  );

  const pick = (exerciseId: string) => {
    if (routine) {
      if (!routine.exerciseIds.includes(exerciseId)) {
        updateRoutine(routine.id, { exerciseIds: [...routine.exerciseIds, exerciseId] });
      }
    } else {
      addExerciseToActive(exerciseId);
    }
    router.back();
  };

  return (
    <FlatList
      data={filtered}
      keyExtractor={(e) => e.id}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre o músculo…"
          placeholderTextColor={colors.muted}
          style={styles.search}
          autoFocus
        />
      }
      ListEmptyComponent={<EmptyState icon="search" title="Sin resultados" text="Prueba con otra búsqueda." />}
      renderItem={({ item }) => {
        const added = routine?.exerciseIds.includes(item.id) ?? false;
        return (
          <Pressable onPress={() => pick(item.id)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.muscle} · {item.equipment}
              </Text>
            </View>
            <Ionicons
              name={added ? 'checkmark-circle' : 'add-circle-outline'}
              size={26}
              color={added ? colors.success : colors.accent}
            />
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  search: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
