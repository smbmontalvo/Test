import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState } from '../components/ui';
import { allExercises } from '../data/exercises';
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
  const filtered = allExercises().filter(
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
        <View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre o músculo…"
            placeholderTextColor={colors.muted}
            style={styles.search}
            accessibilityLabel="Buscar ejercicio"
            autoFocus
          />
          <Pressable
            onPress={() =>
              router.push({ pathname: '/nuevo-ejercicio', params: query.trim() ? { nombre: query.trim() } : {} })
            }
            accessibilityRole="button"
            accessibilityLabel="Crear ejercicio nuevo"
            accessibilityHint="Abre un formulario para crear tu propio ejercicio"
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          >
            <View style={styles.createIcon}>
              <Ionicons name="add" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.accent }]}>Crear ejercicio</Text>
              <Text style={styles.meta}>¿No está en la lista? Añade el tuyo.</Text>
            </View>
          </Pressable>
        </View>
      }
      ListEmptyComponent={
        <EmptyState icon="search" title="Sin resultados" text="Prueba con otra búsqueda o créalo arriba." />
      }
      renderItem={({ item }) => {
        const added = routine?.exerciseIds.includes(item.id) ?? false;
        return (
          <Pressable
            onPress={() => pick(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`${added ? 'Ya en la rutina: ' : 'Añadir '}${item.name}, ${item.muscle}`}
            accessibilityState={{ selected: added }}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.custom && (
                  <View style={styles.mine}>
                    <Text style={styles.mineText}>Tuyo</Text>
                  </View>
                )}
              </View>
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
  name: { color: colors.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  mine: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mineText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  createIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
